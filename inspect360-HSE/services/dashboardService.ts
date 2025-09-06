import { supabase } from '../config/supabase';
import { Inspection } from '../types/inspection';

export interface DashboardStats {
  totalInspections: number;
  pendingInspections: number;
  completedToday: number;
  criticalIssues: number;
  safetyScore: number;
  lastInspection: string | null;
  totalTemplates: number;
  activeInspectors: number;
  completedThisMonth: number;
  avgCompletionTime: number;
}

export interface RecentInspection {
  id: string;
  location: string;
  status: string;
  priority: string;
  date: string;
  inspector: string;
  title: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  due: string;
  type: string;
  assignedTo?: string;
  priority: string;
}

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get total inspections count
      const { count: totalInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true });

      // Get pending inspections count
      const { count: pendingInspections } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'in-progress']);

      // Get completed today count
      const today = new Date().toISOString().split('T')[0];
      const { count: completedToday } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', today);

      // Get critical issues count (high priority pending inspections)
      const { count: criticalIssues } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'critical')
        .neq('status', 'completed');

      // Get completed inspections for safety score calculation
      const { data: completedInspections } = await supabase
        .from('inspections')
        .select('score')
        .eq('status', 'completed')
        .not('score', 'is', null) as { data: { score: number }[] | null };

      // Calculate average safety score
      const safetyScore = completedInspections && completedInspections.length > 0
        ? Math.round(
            completedInspections.reduce((sum, inspection) => sum + (inspection.score || 0), 0) / 
            completedInspections.length
          )
        : 0;

      // Get last inspection
      const { data: lastInspectionData } = await supabase
        .from('inspections')
        .select('completed_at, created_at')
        .order('completed_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1) as { data: { completed_at: string | null; created_at: string }[] | null };

      const lastInspection = lastInspectionData && lastInspectionData.length > 0
        ? this.formatTimeAgo(lastInspectionData[0].completed_at || lastInspectionData[0].created_at)
        : null;

      // Get total templates count
      const { count: totalTemplates } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get active inspectors count (users with inspector role)
      const { count: activeInspectors } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'inspector')
        .eq('status', 'approved');

      // Get completed this month count
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: completedThisMonth } = await supabase
        .from('inspections')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', startOfMonth);

      // Calculate average completion time (in hours)
      const { data: completionTimes } = await supabase
        .from('inspections')
        .select('created_at, completed_at')
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .limit(100) as { data: { created_at: string; completed_at: string }[] | null }; // Sample last 100 completed inspections

      const avgCompletionTime = completionTimes && completionTimes.length > 0
        ? Math.round(
            completionTimes.reduce((sum, inspection) => {
              const created = new Date(inspection.created_at).getTime();
              const completed = new Date(inspection.completed_at).getTime();
              const hours = (completed - created) / (1000 * 60 * 60);
              return sum + hours;
            }, 0) / completionTimes.length
          )
        : 0;

      return {
        totalInspections: totalInspections || 0,
        pendingInspections: pendingInspections || 0,
        completedToday: completedToday || 0,
        criticalIssues: criticalIssues || 0,
        safetyScore,
        lastInspection,
        totalTemplates: totalTemplates || 0,
        activeInspectors: activeInspectors || 0,
        completedThisMonth: completedThisMonth || 0,
        avgCompletionTime
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  async getRecentInspections(): Promise<RecentInspection[]> {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          id,
          title,
          location,
          status,
          priority,
          date,
          inspector,
          created_at,
          completed_at
        `)
        .order('created_at', { ascending: false })
        .limit(5) as { 
          data: {
            id: string;
            title: string;
            location: string;
            status: string;
            priority: string;
            date: string;
            inspector: string;
            created_at: string;
            completed_at: string | null;
          }[] | null;
          error: any;
        };

      if (error) throw error;

      return (data || []).map(inspection => ({
        id: inspection.id,
        location: inspection.location,
        status: inspection.status,
        priority: inspection.priority,
        date: new Date(inspection.date).toLocaleDateString(),
        inspector: inspection.inspector,
        title: inspection.title
      }));
    } catch (error) {
      console.error('Error fetching recent inspections:', error);
      throw error;
    }
  },

  async getUpcomingTasks(): Promise<UpcomingTask[]> {
    try {
      // Get upcoming inspection assignments with inspection details
      const { data: assignments, error } = await supabase
        .from('inspection_assignments')
        .select(`
          id,
          due_date,
          priority,
          status,
          assigned_to,
          notes,
          inspections:inspection_id(title),
          user_profiles!inspection_assignments_assigned_to_fkey(full_name)
        `)
        .in('status', ['assigned', 'in_progress'])
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(10) as {
          data: {
            id: string;
            due_date: string;
            priority: string;
            status: string;
            assigned_to: string;
            notes: string;
            inspections: { title: string } | null;
            user_profiles: { full_name: string } | null;
          }[] | null;
          error: any;
        };

      if (error) throw error;

      const upcomingTasks: UpcomingTask[] = (assignments || []).map(assignment => ({
        id: assignment.id,
        title: assignment.inspections?.title || assignment.notes || 'Inspection Assignment',
        due: this.formatDueDate(assignment.due_date),
        type: 'inspection',
        assignedTo: assignment.user_profiles?.full_name,
        priority: assignment.priority
      }));

      // Add some system tasks (you can customize these based on your business logic)
      const systemTasks: UpcomingTask[] = [
        {
          id: 'monthly-audit',
          title: 'Monthly Safety Audit',
          due: this.getNextMonthlyAuditDate(),
          type: 'audit',
          priority: 'high'
        },
        {
          id: 'quarterly-review',
          title: 'Quarterly Safety Review',
          due: this.getNextQuarterlyReviewDate(),
          type: 'review',
          priority: 'medium'
        }
      ];

      return [...upcomingTasks, ...systemTasks]
        .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching upcoming tasks:', error);
      throw error;
    }
  },

  formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    return date.toLocaleDateString();
  },

  formatDueDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    const diffInDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      return `${diffInDays} days`;
    }
    
    return date.toLocaleDateString();
  },

  getNextMonthlyAuditDate(): string {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth.toLocaleDateString();
  },

  getNextQuarterlyReviewDate(): string {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const nextQuarterMonth = (currentQuarter + 1) * 3;
    const nextQuarter = new Date(now.getFullYear(), nextQuarterMonth, 1);
    return nextQuarter.toLocaleDateString();
  }
};
