import { Atmosphere4401 } from "./4401-81.js";
import { Aerodynamics } from "./aerodynamic.js";
import { Model } from "./model.js";
import { initRorg, initMurg, initNurg, initLarg, deg2rad, modulOfValue } from "./helper.js";

class FlySpace extends Model {
    #eps = 1e-4;

    constructor(N, Kv, Kn, Ke) {
        super(Kv, Kn, Ke);

        this.N = N;
        this.THETc = deg2rad(-39);
        this.V = 4790 - 10 * N;
        this.dt = 1e-3;
        this.Ke = Ke;

        this.stage = [
            0,                                        // [0] this.t, 
            0,                                        // [1] this.Xg, 
            40000 - 100 * this.N,                     // [2] this.Yg, 
            0,                                        // [3] this.Zg, 
            deg2rad(-39),                             // [4] this.thet, 
            0,                                        // [5] this.psi, 
            0,                                        // [6] this.gama, 
            0,                                        // [7] this.alpha, 
            0,                                        // [8] this.betta, 
            this.V * math.cos(this.THETc),            // [9] this.Vxg, 
            this.V * math.sin(this.THETc),            // [10] this.Vyg, 
            0,                                        // [11] this.Vzg, 
            0,                                        // [12] this.deltavf, 
            0,                                        // [13] this.deltanf, 
            0,                                        // [14] this.deltaef, 
            0.4,                                      // [15] this.wx, 
            0,                                        // [16] this.wy, 
            0,                                        // [17] this.wz, 
            initRorg(0, deg2rad(-39), 0),             // [18] this.rhoRG, 
            initLarg(0, deg2rad(-39), 0),             // [19] this.lyRG, 
            initMurg(0, deg2rad(-39), 0),             // [20] this.muRG, 
            initNurg(0, deg2rad(-39), 0),             // [21] this.nuRG
        ];

        this.XLSX = this.stage.map(val => [val]);

    }

    getFly() {
        while (this.stage[2] >= this.#eps) {
            // debugger
            const stage_prev = [...this.stage];
            const V = modulOfValue(this.stage[9], this.stage[10], this.stage[11]);
            const atm = new Atmosphere4401(this.stage[2]);
            const M = V / atm.a;
            const q = atm.rho * V ** 2 / 2;
            const adh = new Aerodynamics(M, V, q, this.stage[15], this.stage[16], this.stage[17], this.stage[7], this.stage[8], this.stage[12], this.stage[13], this.stage[14])
            const Fssk = [[-adh.X], [adh.Y], [adh.Z]];
            const Anzsk_ssk = this.nzsk_ssk(this.stage[18], this.stage[19], this.stage[20], this.stage[21]);
            const Fnzsk = math.multiply(math.inv(Anzsk_ssk), Fssk);
            const [Fxg, Fyg, Fzg] = [Fnzsk[0][0], Fnzsk[1][0], Fnzsk[2][0]];

            // Пересчет параметров
            // if (+this.stage[0].toFixed(3) === 0.376) debugger
            this.euler(this.stage, Fxg, Fyg, Fzg, adh.Mx, adh.My, adh.Mz, this.stage[9], this.stage[10], this.stage[11], this.stage[1], this.stage[2], this.stage[3], this.stage[15], this.stage[16], this.stage[17], this.stage[18], this.stage[19], this.stage[20], this.stage[21], this.stage[0], this.dt);

            const rgNorm = modulOfValue(this.stage[18], this.stage[19], this.stage[20], this.stage[21])
            this.stage[18] /= rgNorm;
            this.stage[19] /= rgNorm;
            this.stage[20] /= rgNorm;
            this.stage[21] /= rgNorm;
            const Vnzsk = [[this.stage[9]], [this.stage[10]], [this.stage[11]]];
            const Anzsk_sskRG = this.nzsk_ssk(this.stage[18], this.stage[19], this.stage[20], this.stage[21]);
            const Vssk = math.multiply(Anzsk_sskRG, Vnzsk);

            this.stage[4] = this.thetf(this.stage[18], this.stage[19], this.stage[20], this.stage[21]);
            this.stage[5] = this.psif(this.stage[18], this.stage[19], this.stage[20], this.stage[21]);
            this.stage[6] = this.gammaf(this.stage[18], this.stage[19], this.stage[20], this.stage[21]);
            this.stage[7] = this.alphaf(Vssk[1][0], Vssk[0][0]);
            this.stage[8] = this.bettaf(Vssk[2][0], modulOfValue(Vssk[0][0], Vssk[1][0], Vssk[2][0]));
            this.stage[12] = this.deltavf(this.stage[4], stage_prev[4], this.dt, this.Kv);
            this.stage[13] = this.deltanf(this.stage[5], stage_prev[5], this.dt, this.Kn);
            this.stage[14] = this.deltaef(this.stage[6], stage_prev[6], this.dt, this.Ke, this.Ke);

            this.stage[0] += this.dt;

            if (this.stage[2] < 0) {
                this.stage = [...stage_prev];
                this.dt /= 10;
                continue;
            }

            // if (+this.stage[0].toFixed(3) * 100 % 25 === 0 || (this.stage[2] <= this.#eps && this.stage[2] > 0))
            if (+this.stage[0].toFixed(3) * 100 % 25 === 0 || (this.#eps >= this.stage[2] > 0))
            // if (+this.stage[0].toFixed(3) * 100 % 25 === 0) 
                for (let c = 0; c < this.XLSX.length; c++) 
                    this.XLSX[c].push(this.stage[c]);
        }
    }

    getResult() {

        const app = 'app';
        const HEADER_TABLE = ['t', 'Xg', 'Yg', 'Zg', 'thet', 'psi', 'gamma', 'alpha', 'betta', 'Vxg', 'Vyg', 'Vzg', 'dv', 'dn', 'de', 'wx', 'wy', 'wz', 'rho', 'ly', 'mu', 'nu'];
        const ANGULARS = [4,5,6,7,8,12,13,14]
        const data = this.XLSX;
        const table = document.createElement('table');
  
        table.style.borderCollapse = 'collapse'; // Убираем разделение ячеек

        // Создаём заголовок таблицы
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        console.log(1111);

        HEADER_TABLE.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.border = '1px solid black'; // Добавляем границы ячеек
            th.style.padding = '5px';
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Предполагается, что все вложенные массивы в 'data' одинаковой длины
        const numRows = data[0].length;

        for (let i = 0; i < numRows; i++) {
            const row = document.createElement('tr');
            
            data.forEach((colArray,ind) => {
                const angul = ANGULARS.includes(ind);
                const td = document.createElement('td');
                td.textContent = angul ? colArray[i] * 180 / math.pi : colArray[i];
                td.style.border = '1px solid black'; // Добавляем границы ячеек
                td.style.padding = '5px';
                row.appendChild(td);
            });

            tbody.appendChild(row);
        }

        table.appendChild(tbody);

        // Добавляем таблицу в документ (например, в элемент с id 'table-container')
        const container = document.getElementById(app);
        container.innerHTML = ''; // Очищаем контейнер перед добавлением таблицы
        container.appendChild(table);
    }


}

const initFly = new FlySpace(12, 0, 0, 0);
initFly.getFly();
initFly.getResult();
