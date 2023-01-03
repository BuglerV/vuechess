import Game from './../Game'

class AbstractFigure {

	/**
	 * Цвет фигуры.
	 * 
	 * @var {string}
	 */
	color = '';

	/**
	 * Положение фигуры на доске.
	 * 
	 * @var {int}
	 */
	row = null;
	col = null;

	/**
	 * Клетки, на которые фигура может пойти.
	 * 
	 * @var {array}
	 */
	availableCells = [];

	/**
	 * Клетки, которые при проверке в любом случае считаются пустыми.
	 * 
	 * @var {array}
	 */
	static addEmpty = new Set;

	/**
	 * Клетки, на которых при проверке должны показываться как с фигурами.
	 * 
	 * @var {array}
	 */
	static addFigure = new Map;

	/**
	 * Ходит ли фигура на несколько клеток в одну сторону.
	 * 
	 * @var {boolean}
	 */
	_rentgen = false;

	/**
	 * Идентификатор хода, во время которого в последний раз запрашивали возможные ходы.
	 * 
	 * @var {int}
	 */
	_id;

	/**
	 * При создании новой фигуры обнуляем параметры.
	 * 
	 * @param {object} options 
	 */
	constructor(options) {
		this.color = options.color ?? 'w';
		this.row   = options.row   ?? null;
		this.col   = options.col   ?? null;
	};

	/**
	 * Должно вернуть название фигуры.
	 * 
	 * @returns {string}
	 */
	getName() {
		return this.constructor.getStaticName();
	};

	/**
	 * Возвращает отображение конкретной фигуры.
	 * 
	 * @returns {string}
	 */
	getView() {
		return this.constructor.getStaticView(this.color);
	};

	/**
	 * Возвращает отображение конкретной фигуры.
	 * 
	 * @param {?string} color
	 * 
	 * @returns {string}
	 */
	static getStaticView(color) {
		return `<div class="figure" style="background-image: url(/images/${color}${this.getStaticName()}.png);"></div>`;
	};

	/**
	 * Получить объект клетки, на которой стоит фигура.
	 * 
	 * @returns {object}
	 */
	getCell() {
		return Game.i.cells[this.row][this.col];
	}

	/**
	 * Делаем фигуру активной.
	 * 
	 * @param {array} cells 
	 */
	setActive(cells) {
		// Нужны только те клетки, где нет дружественных фигур.
		let resultCells = this.getAvailableMovesWithoutChecksAndAlly();

		if( this.beforeSetActive ) {
			this.beforeSetActive();
		}

		// Проходим по всем допустимым клеткам и ставим на них выделения.
		resultCells.forEach( cell => {
			cells[cell.row][cell.col].possible = true;
		} );

		// Выделяем саму клетку.
		cells[this.row][this.col].checked = true;
	};

	/**
	 * Чистит дополнительные условия для поиска.
	 */
	_clearAdding() {
		this.constructor.addEmpty.clear();
		this.constructor.addFigure.clear();
	}

	/**
	 * Возвращает все возможные ходы с учетом шахов.
	 * 
	 * @returns {any}
	 */
	getAvailableMovesWithoutChecksAndAlly() {
		let moves = this.getAvailableMoves();

		moves = this._withoutCellsWithAlly(moves);

		return this._withoutCellsWithChecks(moves);
	}

	_withoutCellsWithChecks(cells) {
		this._clearAdding();

		this.constructor.addEmpty.add( this._getCorrectCellFormat(this.row, this.col) );

		cells = cells.filter( cell => {
			this.constructor.addFigure.clear();
			this.constructor.addFigure.set(this._getCorrectCellFormat(cell.row, cell.col), this);

			let c = Game.i.getAllAttackCells();

			c = c.find(cellq => {

				if(this.constructor.addEmpty.has(cellq)){
					return false;
				}
				if(this.constructor.addFigure.has(cellq)){
					let figure = this.constructor.addFigure.get(cellq);

					if( figure.getName() == 'King' && figure.color == this.color ){
						return true;
					}
				}

				let cell2 = this._getObjectFromCellFormat(cellq);

				return Game.i.cells[cell2.row] &&
					   Game.i.cells[cell2.row][cell2.col] &&
					   Game.i.cells[cell2.row][cell2.col].figure &&
					   Game.i.cells[cell2.row][cell2.col].figure.getName() == 'King' &&
					   Game.i.cells[cell2.row][cell2.col].figure.color == this.color;
			});

			return !c;
		});

		this._clearAdding();

		return cells;
	}

	/**
	 * Возвращает все клетки, на которые фигура может сделать ход.
	 * 
	 * @param {boolean} flush 
	 * @returns {array}
	 */
	getAvailableMoves(flush = false) {
		// Если на этом ходу уже считали клетки, то возвращаем посчитанное ранее.
		// if( this._id == Game.i.id && this.color == Game.i.options.move ) {
		// 	return this.availableCells;
		// }

		// Обнуляем массив возможных ходов.
		this.availableCells = [];

		// Считаем возможные клетки.
		this.setAvailableMoves();

		// Устанавливаем идентификатор хода.
		this._id = Game.i.id;

		return this.availableCells;
	};

	/**
	 * Возвращает все клетки, которые фигура может атаковать.
	 * Если клетки для атаки отличаются от клеток, на которые
	 * можно пойти, то этот метод нужно переопределить у потомка.
	 * 
	 * @returns {array}
	 */
	getAttackCellsArray() {
		return this.getAvailableMoves();
	}

	/**
	 * Снимаем выделение фигуры.
	 * 
	 * @param {array} cells
	 */
	setInactive(cells) {
		if( this._beforeInactive ) {
			this._beforeInactive();
		}

		// Проходим по всем допустимым клеткам и снимает с них выделениям.
		this.availableCells.forEach( cell => {
			cell = this._getObjectFromCellFormat(cell);
			cells[cell.row][cell.col].possible = false;
		} );

		// Снимаем с клетки выделение.
		cells[this.row][this.col].checked = false;
	};

	/**
	 * Запускаем ход.
	 * 
	 * @param {object} oldCell 
	 * @param {object} clickedCell 
	 * @param {int} row 
	 * @param {int} col
	 * 
	 * @returns {null|any}
	 */
	makeMove(historyRow) {
		// Получаем объекты обеих клеток.
		const fromCell = Game.i.cells[historyRow.from.row][historyRow.from.col];
		const toCell = Game.i.cells[historyRow.to.row][historyRow.to.col];

		// Снимаем фигуру с клетки.
		fromCell.figure = null;

		// И ставим ее на другую клетку.
		toCell.figure = this;

		// Записываем ее новые координаты.
		toCell.figure.row = historyRow.to.row;
		toCell.figure.col = historyRow.to.col;

		// Результат специальных действий.
		let result = null;

		// Если у фигуры есть специальные настройки хода, то вызываем метод для их обработки.
		if( this.specialMoveChecks ) {
			result = this.specialMoveChecks(historyRow);
		}

		return result;
	}

	/**
	 * Отменяем ход.
	 * 
	 * @param {object} historyRow 
	 * 
	 * @returns {object|any}
	 */
	undoMove(historyRow) {
		// Если у фигуры есть специальные настройки отмены хода, то вызываем метод для их обработки.
		if( this.specialUndoMoveChecks ) {
			let result = this.specialUndoMoveChecks(historyRow);

			if( result ) return result;
		}

		// Получаем объекты обеих клеток.
		const fromCell = Game.i.cells[historyRow.from.row][historyRow.from.col];
		const toCell = Game.i.cells[historyRow.to.row][historyRow.to.col];

		// Снимаем фигуру с клетки.
		const figure = toCell.figure;

		// И ставим ее на другую клетку.
		fromCell.figure = figure;

		// Если ходом была атака другой фигуры, то возвращаем съеденную.
		toCell.figure = historyRow.attack;

		// Записываем ее новые координаты.
		figure.row = historyRow.from.row;
		figure.col = historyRow.from.col;
	}

	// Превращает правильный формат записи идентификатора клетки в удобный объект.
	_getObjectFromCellFormat(cell) {
		return AbstractFigure.getObjectFromCellFormat(cell);
	}

	// Превращает правильный формат записи идентификатора клетки в удобный объект.
	static getObjectFromCellFormat(cell) {
		cell = cell.split('.');

		return {
			row: cell[0],
			col: cell[1]
		};
	}

	// Удаляет из набора клетки, на которых стоят дружественные фигуры.
	_withoutCellsWithAlly(cells) {
		let resultCells = [];

		cells.forEach( cell => {
			cell = this._getObjectFromCellFormat(cell);

			if( !Game.i.cells[cell.row][cell.col].figure || Game.i.cells[cell.row][cell.col].figure.color != this.color ) {
				resultCells.push(cell);
			}
		});

		return resultCells;
	}

	// Возвращает правильный формат идентификатора клетки.
	// То есть в тот формат, в котором клетка будет храниться в массиве доступных ходов.
	static getCorrectCellFormat(row, col) {
		return [row , col].join('.');
	}

	// Возвращает правильный формат идентификатора клетки.
	// То есть в тот формат, в котором клетка будет храниться в массиве доступных ходов.
	_getCorrectCellFormat(row, col) {
		return 	AbstractFigure.getCorrectCellFormat(...arguments);
	}

	/**
	 * Проверяет пустая ли клетка с учетом доп условий.
	 * 
	 * @param {object} cell
	 *  
	 * @returns {boolean}
	 */
	_checkCellEmpty(cells, row, col) {
		if( this._checkCellWithFigure(...arguments) ) {
			return false;
		}

		if( this.constructor.addEmpty.has( this._getCorrectCellFormat(row, col) ) ) {
			return true;
		}

		return !cells[row][col].figure;
	}

	/**
	 * Проверяет есть ли на клетке фигура с учетом доп условий.
	 * 
	 * @param {object} cell
	 *  
	 * @returns {boolean}
	 */
	_checkCellWithFigure(cells, row, col) {
		if( this.constructor.addEmpty.has( this._getCorrectCellFormat(row, col) ) ) {
			return false;
		}

		if( this.constructor.addFigure.has( this._getCorrectCellFormat(row, col) ) ) {
			return true;
		}

		return cells[row][col].figure;
	}

	/**
	 * Проверяем существование клетки.
	 * 
	 * @param {array} cells 
	 * @param {int} row 
	 * @param {int} col
	 * 
	 * @returns {boolean} 
	 */
	_checkCellIsExists(cells, row, col) {
		return cells[row] && cells[row][col];
	}

	/**
	 * Если клетка пустая, то записывает ее в массив ходов.
	 * 
	 * @param {array} cells 
	 * @param {int} row 
	 * @param {int} col 
	 * 
	 * @returns {boolean}
	 */
	availableIfEmpty(cells, row, col) {
		if( this._checkCellIsExists(...arguments) && this._checkCellEmpty(...arguments) ) {

			this.availableCells.push(this._getCorrectCellFormat(row, col));

			return true;
		}

		return false;
	};

	/**
	 * Если клетка с фигурой, то записывает ее в массив ходов.
	 * 
	 * @param {array} cells 
	 * @param {int} row 
	 * @param {int} col 
	 * 
	 * @returns {boolean}
	 */
	availableIfEnemy(cells, row, col) {
		if( this._checkCellIsExists(...arguments) && this._checkCellWithFigure(...arguments) ) {

			this.availableCells.push(this._getCorrectCellFormat(row, col));

			return true;
		}

		return false;
	};

	/**
	 * Если клетка существует, то записывает ее в массив ходов.
	 * Если она пустая, то возвращает true для дальнейшей проверки.
	 * 
	 * @param {array} cells 
	 * @param {int} row 
	 * @param {int} col 
	 * 
	 * @returns {boolean}
	 */
	availabaleIfNotAlly(cells, row, col) {
		if( this._checkCellIsExists(...arguments) ) {

			this.availableCells.push(this._getCorrectCellFormat(row, col));

			if( this._checkCellEmpty(...arguments) ) {
				return true;
			}
		}

		return false;
	}



	
	// availableIfEmpty(cells, row, col) {
	// 	if(
	// 		cells[row] &&
	// 		cells[row][col] &&
	// 		!cells[row][col].figure
	// 	) {
	// 		this.availableCells.push(this._getCorrectCellFormat(row, col));
			
	// 		return true;
	// 	}

	// 	return false;
	// };

	// availabaleIfNotAlly(cells, row, col) {
	// 	if(
	// 		cells[row] &&
	// 		cells[row][col] //&&
	// 		// cells[row][col]?.figure?.color != this.color
	// 	) {
	// 		this.availableCells.push(this._getCorrectCellFormat(row, col));
			
	// 		if( !cells[row][col].figure ) {
	// 			return true;
	// 		}
	// 	}

	// 	return false;
	// }

	// availableIfEnemy(cells, row, col) {
	// 	if(
	// 		cells[row] &&
	// 		cells[row][col] &&
	// 		cells[row][col].figure //&&
	// 		// cells[row][col].figure.color != this.color
	// 	) {
	// 		this.availableCells.push(this._getCorrectCellFormat(row, col));
			
	// 		return true;
	// 	}

	// 	return false;
	// };




	// isCellAvailable(method, row, col) {
	// 	// Если метода не существует, то сразу отказ.
	// 	method = '_available' + method.slice(0,1).toUpperCase() + method.slice(1);
	// 	if( !this[method] ) return;

	// 	// Существует ли клетка на поле.
	// 	if( !Game.i.cells[row] || !Game.i.cells[row][col] ) {
	// 		return false;
	// 	}

	// 	// Делаем проверку.
	// 	const result = this[method](Game.i.cells[row][col]);

	// 	// И если она пройдена, записываем клетку в доступные.
	// 	if( result ) {
	// 		this.availableCells.push({ row, col });
	// 	}

	// 	return result;
	// }

	// /**
	//  * Проверка на то, что клетка пустая.
	//  * 
	//  * @param {object} cell 
	//  * @returns 
	//  */
	// _availableIfEmpty(cell) {
	// 	return cell.figure == null;
	// };

	// /**
	//  * Проверка на то, что клетка занята вражеской фигурой.
	//  * 
	//  * @param {object} cell
	//  * @returns 
	//  */
	// _availableIfEnemy(cell) {
	// 	return cell.figure && cell.figure.color != this.color;
	// };

	// /**
	//  * Проверка на то, что клетка не занята своей фигурой.
	//  * 
	//  * @param {object} cell 
	//  * @returns 
	//  */
	// _availabaleIfNotAlly(cell) {
	// 	return this._availableIfEmpty(cell) || this._availableIfEnemy();
	// }
};

export default AbstractFigure