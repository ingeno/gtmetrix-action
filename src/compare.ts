export const compare = (metric: string, reference: string | number | undefined, value: string | number): boolean => {
  if (reference === undefined) {
    return true;
  }

  if (typeof value === 'number' && metric === 'structure_score') {
    return reference <= value;
  }

  return reference >= value;
};
