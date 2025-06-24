// app/[category]/[id]/page.js
import React from 'react';
import Item from '@/components/category/item/id/Item';

export default function Page({ params }) {
  return <Item />;
}
