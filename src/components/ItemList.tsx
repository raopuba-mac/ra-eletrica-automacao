import React, { ReactNode } from 'react';

interface ItemListProps<T> {
  /** Array de itens a serem renderizados */
  items: T[];
  /** Função que dita como cada item deve ser renderizado */
  renderItem: (item: T, index: number) => ReactNode;
  /** Classe opcional para customizar a lista */
  className?: string;
  /** Chave opcional extraída do item para o React (ex: id). Se não existir, usará o index */
  keyExtractor?: (item: T, index: number) => string | number;
}

export function ItemList<T>({ 
  items, 
  renderItem, 
  className = '',
  keyExtractor
}: ItemListProps<T>) {
  if (!items || items.length === 0) {
    return <div className="text-slate-500 text-sm py-4 text-center">Nenhum item encontrado.</div>;
  }

  return (
    <ul className={`divide-y divide-slate-100 ${className}`}>
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item, index) : index;
        return (
          <li key={key} className="py-3">
            {renderItem(item, index)}
          </li>
        );
      })}
    </ul>
  );
}
