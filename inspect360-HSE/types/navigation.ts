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
};

export type TemplateStackParamList = {
  TemplatesList: undefined;
  NewInspection: undefined;
  TemplateBuilder: { template?: InspectionTemplate };
};
