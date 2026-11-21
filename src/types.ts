export type ListingLanguage = 'English' | 'Urdu' | 'Roman Urdu';

export interface ProductListing {
  productTitle: string;
  productDescription: string;
  keySellingPoints: string[];
  socialPost: {
    caption: string;
    hashtags: string[];
  };
  whatsappMessage: string;
  photoFeedback: {
    lighting: string;
    background: string;
    angle: string;
  };
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  language: ListingLanguage;
  notes: string;
  thumbnail: string;
  result: ProductListing;
}
