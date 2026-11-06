export interface HeroSlide {
  id: number;
  badge?: string;
  titlePart1: string;
  titlePart2: string;
  subtitle: string;
  offerTag?: string;
  ctaTextDesktop: string;
  ctaTextMobile: string;
  categoryTarget?: string;
  offerTarget?: string;
  desktopImage: string;
  mobileImage: string;
  active: boolean;
}

export interface PromoBanner {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
  targetCategory?: string;
  targetOffer?: string;
}

export interface FeaturedBlock {
  id: number;
  title: string;
  ctaText: string;
  image: string;
  category: string;
}

export interface LookbookConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
  offerTarget: string;
}
