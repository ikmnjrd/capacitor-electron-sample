export interface ImagePluginInterface {
  getSampleImage(): Promise<{ src: string }>
  saveImage(options: { src: string }): Promise<{ success: boolean }>
}
