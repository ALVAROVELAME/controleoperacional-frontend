import type { Animal } from '../types';

interface Props {
  animais: Animal[];
  onEditar: (animal: Animal) => void;
  onExcluir: (id: string | number) => void;   // ← ajustado
}

export default function AnimalList({ animais, onEditar, onExcluir }: Props) {
  return (
    <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
      <thead style={{ background: '#e6f4e6' }}>
        <tr>
          <th>Brinco</th>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Produção Média</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {animais.map((animal) => (
          <tr key={animal.id}>
            <td>{animal.brinco}</td>
            <td>{animal.nome}</td>
            <td>{animal.categoria}</td>
            <td>{animal.producaoDiaria} L</td>
            <td>
              <button onClick={() => onEditar(animal)} style={{ marginRight: 5 }}>
                Editar
              </button>
              <button onClick={() => onExcluir(animal.id!)}>Excluir</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}