declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }, options?: any): Promise<MammothResult>;
  export function extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<MammothResult>;
  export const images: {
    imgElement: (fn: (image: any) => Promise<{ src: string; style?: string; alt?: string }>) => any;
  };
}
