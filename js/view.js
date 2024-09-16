export class View {
    constructor(datas) {
        this.datas = datas;
    }

    getResult() {
        const data = this.datas;
        const app = 'app';

        const HEADER_TABLE = ['t', 'Xg', 'Yg', 'Zg', 'thet', 'psi', 'gamma', 'alpha', 'betta', 'Vxg', 'Vyg', 'Vzg', 'dv', 'dn', 'de', 'wx', 'wy', 'wz', 'rho', 'ly', 'mu', 'nu'];
        const ANGULARS = [4, 5, 6, 7, 8, 12, 13, 14];

        const numRows = data[0].length;
        const rowData = [];

        for (let i = 0; i < numRows; i++) {
            const row = {};
            HEADER_TABLE.forEach((header, index) => {
                const angul = ANGULARS.includes(index);
                row[header] = angul ? data[index][i] * 180 / Math.PI : data[index][i];
            });
            rowData.push(row);
        }

        const columnDefs = HEADER_TABLE.map(header => ({
            headerName: header,
            field: header
        }));

        const gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData,
            defaultColDef: {
                flex: 1,
                minWidth: 100,
                resizable: true,
                // sortable: true,
                filter: true,
            },
            // pagination: true,
            enableRangeSelection: true,  // Включаем выделение диапазона ячеек
            copyHeadersToClipboard: true,       // Включаем возможность копирования данных
            rowSelection: 'multiple',    // Включаем множественный выбор строк
            enableCharts: true,          // Включаем возможность построения графиков
            enableChartToolPanels: true, // Включаем панель инструментов для графиков
            chartThemes: ['ag-pastel', 'ag-material', 'ag-vivid', 'ag-solar'], // Темы графиков
            popupParent: document.body,  // Где отображать всплывающие элементы
            // domLayout: 'autoHeight'
            // getChartToolbarItems: () => ['chartDownload', 'chartData', 'chartFormat'], // Показываем настройки графика
            // Настройки для X Y scatter и Line chart
            processChartOptions: (params) => {
                const options = params.options;

                // Проверяем тип графика: если Scatter, добавляем Line на график
                if (params.type === 'scatter') {
                    options.seriesDefaults.scatter.series.line = {
                        enabled: true, // Включаем линии на Scatter графике
                    };
                }

                return options;
            }
            // paginationPageSize: 18,
        };

        const container = document.getElementById(app);
        container.innerHTML = '';

        const gridDiv = document.createElement('div');
        gridDiv.classList.add('ag-theme-alpine');
        gridDiv.style.width = '100%';
        gridDiv.style.height = '100vh';
        container.appendChild(gridDiv);

        new agGrid.createGrid(gridDiv, gridOptions);
    }
}