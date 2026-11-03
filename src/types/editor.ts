export type WorkspaceMode = 'visual' | 'code' | 'preview';

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

export interface EmailMetadata {
  subject: string;
  preheader: string;
  senderName: string;
  senderEmail: string;
}

export interface SelectedElementInfo {
  id: string;
  tagName: string;
  type: 'text' | 'heading' | 'button' | 'image' | 'container' | 'table' | 'row' | 'cell' | 'divider' | 'spacer' | 'unknown';
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    textAlign: string;
    lineHeight: string;
    letterSpacing: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    width: string;
    height: string;
    borderRadius: string;
    borderWidth: string;
    borderColor: string;
    borderStyle: string;
    display: string;
    position: string;
    transform: string;
  };
  attributes: {
    href?: string;
    src?: string;
    alt?: string;
    title?: string;
    width?: string;
    height?: string;
    align?: string;
    bgColor?: string;
  };
  text: string;
  isLocked: boolean;
}

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  label?: string;
}

export interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
  affectedClients: string[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  html: string;
  metadata: EmailMetadata;
}
