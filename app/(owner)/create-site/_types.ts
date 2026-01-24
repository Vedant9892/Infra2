export interface BoundaryPoint {
    latitude: number;
    longitude: number;
}

export interface SiteFormData {
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    boundary: BoundaryPoint[];
    overlayImage?: string; // base64 or uri
    overlaySettings?: {
        opacity: number;
        scale: number;
        rotation?: number;
        bearing?: number;
    };
}

export type CreateSiteStep = 'details' | 'boundary';
