import type { Tree } from '../api/trees.api';

export type TreeIdentityInput = {
  name?: string | null;
  species?: string | null;
  location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const submittedTreeIdentityKeys = new Set<string>();

function normalizeText(value: string | null | undefined) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function normalizeCoordinate(value: number | string | null | undefined) {
  const numeric = typeof value === 'string'
    ? Number(value.trim().replace(',', '.'))
    : Number(value);

  return Number.isFinite(numeric) ? numeric.toFixed(6) : '';
}

export function getTreeIdentityKey(tree: TreeIdentityInput) {
  return [
    normalizeText(tree.name),
    normalizeText(tree.species),
    normalizeText(tree.location),
    normalizeCoordinate(tree.latitude),
    normalizeCoordinate(tree.longitude),
  ].join('|');
}

export function hasMatchingTreeIdentity(
  trees: Array<Partial<Tree> | TreeIdentityInput>,
  target: TreeIdentityInput,
) {
  const targetKey = getTreeIdentityKey(target);
  return trees.some((tree) => getTreeIdentityKey(tree) === targetKey);
}

export function wasTreeIdentitySubmitted(tree: TreeIdentityInput) {
  return submittedTreeIdentityKeys.has(getTreeIdentityKey(tree));
}

export function markTreeIdentitySubmitted(tree: TreeIdentityInput) {
  submittedTreeIdentityKeys.add(getTreeIdentityKey(tree));
}

export function unmarkTreeIdentitySubmitted(tree: TreeIdentityInput) {
  submittedTreeIdentityKeys.delete(getTreeIdentityKey(tree));
}
