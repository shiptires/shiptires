export interface Warehouse {
  id: string;
  label: string;
  name: string;
  street1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export const WAREHOUSES: Warehouse[] = [
  {
    id: "sacramento",
    label: "Sacramento, CA",
    name: "Ship.Tires",
    street1: "1831 K Street",
    city: "Sacramento",
    state: "CA",
    postalCode: "95811",
    country: "US",
    phone: "2792388473",
  },
];

export const DEFAULT_WAREHOUSE_ID = "sacramento";

export function getWarehouse(id: string): Warehouse | undefined {
  return WAREHOUSES.find((w) => w.id === id);
}
