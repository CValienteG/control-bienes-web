"""Verifica las cuatro descargas sintéticas, sin alterar sus archivos."""
import sys
from pathlib import Path
from openpyxl import load_workbook

folder = Path(sys.argv[1])
headers = ['ID', 'CÓDIGO CONTABLE', 'ACTIVO (grupo)', 'CÓDIGO ADMINISTRACIÓN',
           'CÓDIGO CR', 'CR', 'Prioridad CR', 'RESULTADO', 'FECHA DE INVENTARIO',
           'EDIFICIO', 'PISO', 'UBICACIÓN', 'CANTIDAD', 'OPERATIVIDAD',
           'CONSERVACIÓN', 'CUSTODIO', 'OBSERVACIONES']
for tipo in ('anual', 'puntual'):
    for alcance in ('20312', 'todos'):
        path = folder / f'nueva-{tipo}-{alcance}.xlsx'
        wb = load_workbook(path)
        ws = wb['ETIQUETA']
        assert [c.value for c in ws[1]] == headers
        assert ws.max_row == (152 if alcance == '20312' else 154)
        assert ws.freeze_panes == 'A2'
        table = ws.tables['RelacionesCRAFV3']
        assert table.ref == f'A1:Q{ws.max_row}'
        assert table.autoFilter.ref == table.ref
        assert not table.tableStyleInfo.showRowStripes
        for row in ws:
            assert all(c.fill.fgColor.rgb == 'FFF1F3F0' for c in row[:8])
            assert all(c.fill.fgColor.rgb == 'FFFFF8DC' for c in row[8:])
        assert ws['I2'].number_format == 'dd/mm/yyyy'
        validations = ws.data_validations.dataValidation
        # Edificio, piso y ubicación son texto libre: solo hay listas en operatividad y conservación.
        assert len(validations) == 3
        assert {str(d.sqref).split(':')[0] for d in validations} == {'M2', 'N2', 'O2'}
        assert set(wb.defined_names.keys()) >= {'V3Operatividad', 'V3Conservacion'}
        assert not {'V3Edificios', 'V3Pisos', 'V3Ambientes'} & set(wb.defined_names.keys())
        for dv in validations:
            if dv.type == 'list':
                name = wb.defined_names[dv.formula1]
                targets = list(name.destinations)
                assert len(targets) == 1 and targets[0][0] == 'Listas'
                assert wb['Listas'][targets[0][1]][0][0].value is not None
            else:
                assert (dv.formula1, dv.formula2) == ('0', '1')
        assert wb['Listas'].sheet_state == 'hidden'
        assert 'Léeme' in wb.sheetnames
        assert all(c.data_type != 'f' for row in ws for c in row)
        print('OK XLSX:', tipo, alcance, 'fila 1, 17 columnas, bloques, ubicación libre, dos listas, filtros, fecha e IDs fijos')
