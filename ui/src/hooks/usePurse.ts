import { useAgoric } from '@agoric/react-components';
import type { Purse } from '../types';

export const usePurse = (brandPetname: string) => {
  const { purses } = useAgoric();

  return purses?.find(p => p.brandPetname === brandPetname) as
    | Purse
    | undefined;
};
