import { describe, expect, it } from 'vitest';
import {
  addToCart,
  cartUnits,
  removeFromCart,
  setCartQuantity,
  toggleId,
  updateCartLine,
} from './posCart';

type Line = { productId: string; quantity: number; batch: string };
const line = (productId: string, quantity = 1): Line => ({ productId, quantity, batch: '' });

describe('posCart', () => {
  it('menambah baris baru lalu menaikkan jumlah', () => {
    let lines = addToCart<Line>([], 'a', () => line('a'));
    lines = addToCart(lines, 'a', () => line('a'));
    expect(lines).toEqual([line('a', 2)]);
  });

  it('tidak melewati batas', () => {
    expect(addToCart([line('a', 3)], 'a', () => line('a'), 3)[0].quantity).toBe(3);
    expect(addToCart<Line>([], 'a', () => line('a'), 0)).toEqual([]);
  });

  it('jumlah 0 menghapus baris', () => {
    expect(setCartQuantity([line('a', 2)], 'a', 5)[0].quantity).toBe(5);
    expect(setCartQuantity([line('a', 2)], 'a', 0)).toEqual([]);
    expect(removeFromCart([line('a'), line('b')], 'a')).toEqual([line('b')]);
  });

  it('mengubah isian baris dan menjumlah unit', () => {
    expect(updateCartLine([line('a')], 'a', { batch: 'B1' })[0].batch).toBe('B1');
    expect(cartUnits([line('a', 2), line('b', 3)])).toBe(5);
  });

  it('memilih dan melepas id', () => {
    expect(toggleId(['1'], '2')).toEqual(['1', '2']);
    expect(toggleId(['1', '2'], '1')).toEqual(['2']);
  });
});
