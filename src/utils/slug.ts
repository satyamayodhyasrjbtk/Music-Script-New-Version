export function slugify(text: string): string {
  if (!text) return 'song-' + Date.now();
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace accented characters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace & with 'and'
    .replace(/&/g, '-and-')
    // Remove symbols and non-alphanumeric except hyphen
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces or hyphens with a single hyphen
    .replace(/[\s-]+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

export function generateUniqueTrackSlug(
  title: string,
  existingSlugs: string[],
  currentTrackId?: string
): string {
  const baseSlug = slugify(title) || 'track';
  let slug = baseSlug;
  let counter = 2;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export function generateUniqueCategorySlug(
  name: string,
  existingSlugs: string[],
  currentCategoryId?: string
): string {
  const baseSlug = slugify(name) || 'folder';
  let slug = baseSlug;
  let counter = 2;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
