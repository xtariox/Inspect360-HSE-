import { InspectionTemplate } from './inspection';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AppStackParamList = {
  Home: undefined;
  Inspection: undefined;
  Templates: undefined;
  Settings: undefined;
};

export type InspectionStackParamList = {
  InspectionList: undefined;
  NewInspection: undefined;
  InspectionForm: { 
    template?: InspectionTemplate;
    inspectionId?: string;
    readOnly?: boolean;
  };
};

export type TemplateStackParamList = {
  TemplatesList: undefined;
  NewInspection: undefined;
  InspectionForm: { 
    template?: InspectionTemplate;
    inspectionId?: string;
    readOnly?: boolean;
  };
  TemplateBuilder: { template?: InspectionTemplate };
};
