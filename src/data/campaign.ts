import type { HeroSlide, PromoBanner, FeaturedBlock, LookbookConfig } from '../types/campaign';

export const SAMPLE_HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    badge: "Diwali Special Campaign",
    titlePart1: "Diwali",
    titlePart2: "Festive Collection",
    subtitle: "Brighten Your Wardrobe with Timeless Elegance",
    offerTag: "Upto 40% OFF",
    ctaTextDesktop: "Shop the Collection",
    ctaTextMobile: "Shop the Collection",
    offerTarget: "Diwali Sale",
    desktopImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85",
    active: true
  },
  {
    id: 2,
    badge: "Category Spotlight",
    titlePart1: "Elegant Sarees",
    titlePart2: "for Every Occasion",
    subtitle: "Handcrafted Banarasi silks, luxurious organzas, and regal drapes.",
    offerTag: "New Collection",
    ctaTextDesktop: "Shop Sarees",
    ctaTextMobile: "Shop Sarees",
    categoryTarget: "Sarees",
    desktopImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85",
    active: true
  },
  {
    id: 3,
    badge: "Season's Choice",
    titlePart1: "New Arrivals",
    titlePart2: "Fresh Styles for This Season",
    subtitle: "Elevate your wardrobe with newly dropped festive ensembles.",
    offerTag: "Trending Now",
    ctaTextDesktop: "Explore Now",
    ctaTextMobile: "Explore Now",
    offerTarget: "New Festive Collection",
    desktopImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1600&q=85",
    mobileImage: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85",
    active: true
  }
];

export const SAMPLE_PROMO_BANNERS: PromoBanner[] = [
  {
    id: 1,
    badge: "Upto 40% OFF",
    title: "Upto\n40% OFF",
    subtitle: "Festive Collection",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=800&q=80",
    targetOffer: "Diwali Sale"
  },
  {
    id: 2,
    badge: "New Season",
    title: "New\nArrivals",
    subtitle: "Fresh Styles for This Season",
    ctaText: "Explore Now",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    targetOffer: "New Festive Collection"
  },
  {
    id: 3,
    badge: "Exclusive",
    title: "Exclusive\nFestive Sets",
    subtitle: "Complete Your Look",
    ctaText: "Shop Sets",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    targetCategory: "Kurtis"
  }
];

export const SAMPLE_FEATURED_BLOCKS: FeaturedBlock[] = [
  {
    id: 1,
    title: "Silk Sarees",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
    category: "Sarees"
  },
  {
    id: 2,
    title: "Designer Kurtis",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80",
    category: "Kurtis"
  },
  {
    id: 3,
    title: "Bridal Lehengas",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
    category: "Lehengas"
  },
  {
    id: 4,
    title: "Festive Sets",
    ctaText: "Shop Now",
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    category: "Kurtis"
  }
];

export const DEFAULT_LOOKBOOK: LookbookConfig = {
  title: "Diwali\nLookbook",
  subtitle: "Styles for Every Celebration",
  ctaText: "View Lookbook",
  image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85",
  offerTarget: "Diwali Sale"
};
