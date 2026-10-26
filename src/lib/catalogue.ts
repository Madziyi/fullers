export const initialSettings = {
  id: 'site',
  companyName: 'Fullers Aggregate (PVT) LTD',
  phone: '+263 78 747 8592',
  location: 'Sandazi Farm, off Matepatepa Road, Bindura, Zimbabwe',
  experienceValue: '30+',
  experienceLabel: 'Years of experience',
  jobsValue: '700+',
  jobsLabel: 'Jobs done',
  satisfactionValue: '100%',
  satisfactionLabel: 'Client satisfaction',
  awardClaim: 'Award-winning manufacturer',
  seoTitle: 'Concrete products & quarry stones in Bindura',
  seoDescription:
    'Fullers Aggregate manufactures and supplies concrete products and quarry stones in Bindura, Zimbabwe. Explore our range and discuss your project.',
};
export type Settings = typeof initialSettings & { socialLinks?: unknown };
export type CatalogueProduct = {
  id?: string;
  slug: string;
  name: string;
  summary: string;
  image: string | null;
  imageAlt: string;
  applications: string[];
  specifications: unknown;
  featured: boolean;
  body?: unknown;
  faqs?: unknown;
  seo?: unknown;
  focalX?: number;
  focalY?: number;
  relatedIds?: string[];
};
export const initialProducts: CatalogueProduct[] = [
  {
    slug: 'quarry-stones',
    name: 'Quarry Stones',
    summary:
      'Start with the essentials. Quarry stone for your building and construction enquiries.',
    image: '/assets/quarry-stones.webp',
    imageAlt: 'Quarry stones at Fullers Aggregate',
    applications: ['Building'],
    specifications: [],
    featured: true,
  },
  {
    slug: 'bricks',
    name: 'Bricks',
    summary:
      'For the next wall and the next chapter. Explore our brick supply for your building project.',
    image: '/assets/bricks.webp',
    imageAlt: 'Stacks of bricks at Fullers Aggregate',
    applications: ['Building'],
    specifications: [],
    featured: true,
  },
  {
    slug: 'half-moons',
    name: 'Half Moons',
    summary: 'Concrete half-moon units. Talk to our team about the requirements of your project.',
    image: '/assets/half-moons.webp',
    imageAlt: 'Concrete half-moon units supplied by Fullers Aggregate',
    applications: ['Landscaping'],
    specifications: [],
    featured: true,
  },
  {
    slug: 'interlocking-pavers',
    name: 'Interlocking Pavers',
    summary: 'Bring your outdoor spaces together with interlocking paving units.',
    image: '/assets/interlocking-pavers.webp',
    imageAlt: 'Stacks of interlocking pavers at Fullers Aggregate',
    applications: ['Landscaping'],
    specifications: [],
    featured: true,
  },
  {
    slug: 'manhole-rings',
    name: 'Manhole Rings',
    summary:
      'Concrete manhole rings for infrastructure enquiries. Confirm suitability with your project professional.',
    image: null,
    imageAlt: '',
    applications: ['Infrastructure'],
    specifications: [],
    featured: false,
  },
  {
    slug: 'culverts',
    name: 'Culverts',
    summary:
      'Discuss concrete culverts with our team and confirm the requirements of your drainage project.',
    image: null,
    imageAlt: '',
    applications: ['Infrastructure'],
    specifications: [],
    featured: false,
  },
  {
    slug: 'durawall',
    name: 'Durawall',
    summary: 'Concrete walling for your boundary project. Enquire about the options for your site.',
    image: null,
    imageAlt: '',
    applications: ['Building'],
    specifications: [],
    featured: false,
  },
];
export function whatsappUrl(phone: string, product?: string) {
  const digits = phone.replace(/\D/g, '');
  if (!/^263\d{9}$/.test(digits)) throw new Error('A valid Zimbabwe phone number is required.');
  return `https://wa.me/${digits}?text=${encodeURIComponent(product ? `Hello Fullers, I would like to enquire about ${product}.` : 'Hello Fullers, I would like to discuss a quotation for my project.')}`;
}
export function isPublic(
  record: { status: string; publishedAt: Date | null; deletedAt: Date | null },
  now = new Date(),
) {
  return (
    record.status === 'PUBLISHED' &&
    record.deletedAt === null &&
    record.publishedAt !== null &&
    record.publishedAt <= now
  );
}
export const publicWhere = () => ({
  status: 'PUBLISHED' as const,
  deletedAt: null,
  publishedAt: { lte: new Date() },
});
