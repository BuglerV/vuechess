import _ from 'lodash';
import FigureFactory from './figures/figureFactory';
import AbstractFigure from './figures/abstractFigure';

class Game {

	/**
	 * Игровая доска.
	 * 
	 * @var {array}
	 */
	cells = [];

	/**
	 * Параметры игры.
	 * 
	 * @var {object}
	 */
	options = {};

	/**
	 * История сделанных ходов.
	 * 
	 * @var {array|object}
	 */
	history = [];

	/**
	 * Обертка для параметров. Нужна для получаения реактивности, если это требуется.
	 * 
	 * @var {callable|null}
	 */
	static wrapper = null;

	/**
	 * Кобэк для снятия обертки.
	 * 
	 * @var {callable|null}
	 */
	static unwrapper = null;

	/**
	 * Сетка для клеток.
	 * 
	 * @var {array}
	 */
	lettersArray = [];
	numbersArray = [];

	/**
	 * Экземпляр игры.
	 * 
	 * @var Game
	 */
	static i = null;

	/**
	 * Содержимое для модального окна.
	 * 
	 * @var {object}
	 */
	modalContent;

	/**
	 * Уникальный идентификатор хода.
	 * 
	 * @var {int}
	 */
	id = 1000000;

	/**
	 * Интервал для таймера.
	 * 
	 * @var {int|null}
	 */
	_timerInterval = null;

	/**
	 * Время начала хода игрока.
	 * 
	 * @var {int|null}
	 */
	_startingMoveTime = null;

	/**
	 * Время последнего вызова интервала таймера.
	 * 
	 * @var {Date|null}
	 */
	_lastTimeForInterval = null;

	/**
	 * Нажатая клетка игрового поля.
	 * 
	 * @var {object}
	 */
	_clickedCell = null;

	/**
	 * Ячейка истории для будущего сохранения.
	 * 
	 * @var {object|null}
	 */
	_historyRow = null;

	/**
	 * Какая фигура сейчас выбрана.
	 * 
	 * @var {object}
	 */
	_checkedCell = { row: null, col: null };

	/**
	 * Дополнительный список клеток для выделения как атакуемые.
	 */
	_attackCells = new Set;

	/**
	 * Во время создания новой игры сохраняем ее экзепмляр статически.
	 * А так же производим начальные настройки.
	 */
	constructor(row = 8, col = 8) {
		Game.i = this;
		this._createBoard(row, col);
		this._initNewOptions();
		this._initNewHistory();
		this._initModalContent();

		console.log('From constructor: ', this); window.game = this;
	}

	/**
	 * Возвращает все клетки, которые могут атаковать противники.
	 * 
	 * @param {string} color 
	 * 
	 * @returns {array}
	 */
	getAllAttackCells(color) {
		color = color ?? this.options.move;

		let availableAttacksArray = [];

		// Ищем все существующие фигуры не нашего цвета и получаем ходы каждой из них.
		this.cells.forEach((row, rowI) => {
			row.forEach((col, colI) => {
				let cellFormat = AbstractFigure.getCorrectCellFormat(rowI, colI);

				if( AbstractFigure.addEmpty.has( cellFormat ) || AbstractFigure.addFigure.has( cellFormat ) ) {
					return;
				}

				// Собираем все ходы в один массив.
				if(col.figure && col.figure.color != color){
					availableAttacksArray = availableAttacksArray.concat( this._unwrapParameter(col.figure.getAttackCellsArray()) );
				}
			});
		});

		return availableAttacksArray;
	}

	/**
	 * Устанавливает опции модального окна.
	 */
	_initModalContent() {
		this.modalContent = this._wrapParameter({
			isOpen: false,
			method: null,
			choice: null
		});
	}

	/**
	 * Обновляет таймер для текущего игрока.
	 */
	_updateTimer() {
		if(!this._lastTimeForInterval) return;

		// Берем новое время.
		const newTime = new Date;

		// Уменьшаем оставшееся у игрока время на разницу между двумя вызовами этой функции.
		this.options.timers[this.options.move] -= newTime - this._lastTimeForInterval;

		// Если закончилось время.
		if(this.options.timers[this.options.move] < 0) {
			this.options.timers[this.options.move] = 0;
			this.finish();
			return;
		}

		// Cохраняем новое время для будущий использований.
		this._lastTimeForInterval = newTime;
	}

	/**
	 * Останавливаем игру.
	 */
	finish(draw = false) {
		// Стоп.
		this.options.finished = true;
		this.pause();

		let winner = this.options.move == 'w' ? 'b' : 'w';
		winner = draw ? 'n' : winner;

		this.options.winner = winner;
	}

	/**
	 * Заморажиет игру.
	 */
	_freeze() {
		this.options.freeze = true;
	}

	/**
	 * Разморажиет игру.
	 */
	_unfreeze() {
		this.options.freeze = false;
	}

	/**
	 * Ставит игру на паузу.
	 */
	pause() {
		// Cтавим паузу.
		this.options.paused = true;

		// И обновляем часы.
		this._recheckTimers();
	}

	/**
	 * Снимает паузу.
	 */
	unpause() {
		// Если игра уже закончилась, то ничего не делаем.
		if(this.options.finished) {
			return;
		}

		// Снимаем паузу.
		this.options.paused = false;

		// И обновляем часы.
		this._recheckTimers();
	}

	/**
	 * Запускает и останавливает таймер.
	 * 
	 * @returns
	 */
	_recheckTimers() {
		// Если пауза, то просто все останавливаем.
		if(this.options.paused) {
			// Обнуляем время интервала.
			this._lastTimeForInterval = null;

			// Останавливаем часы.
			return clearInterval(this._timerInterval);
		}

		// Иначе обновляем время интервала.
		this._lastTimeForInterval = new Date;

		// Очищаем прошлый интервал, если он запущен.
		clearInterval(this._timerInterval);

		// Обновляем время начала хода.
		this._startingMoveTime = this.options.timers[this.options.move];

		// И запускаем часы.
		this._timerInterval = setInterval(() => {
			this._updateTimer();
		},40);
	}

	/**
	 * Отменяет последний ход.
	 */
	undoMove() {
		this._uncheckOldFigure();

		const row = this.getLastMove();

		if(row) {
			row.active = false;

			row.figure.undoMove(row);

			this._updatePreviousPlayer();

			this._updateAttackCells();
		}
	}

	/**
	 * Возвращает последний отмененный ход.
	 */
	forwardMove() {
		this._uncheckOldFigure();

		const row = this.history.find((row) => {
			return !row.active;
		});

		if(row) {
			row.active = true;

			row.figure.makeMove(row);

			this._updateNextPlayer();

			this._clearAttackCells();
			this._checkCheckAndMat();
			this._markAttackCells();
		}
	}

	/**
	 * Применяет ход из истории по индексу.
	 * 
	 * @param {int} index 
	 */
	setConcreteMove(index) {
		const currentIndex = this.history.findLastIndex((row) => {
			return row.active;
		});

		const method = index > currentIndex ? 'forwardMove' : 'undoMove';
		const times = Math.abs(index - currentIndex);

		for( let i = 1; i <= times; i++) {
			this[method]();
		}
	}

	/**
	 * Подготавливает фигуры для классических шахмат.
	 * 
	 * @param {boolean} shuffle 
	 * 
	 * @returns {array}
	 */
	_initClassicChessGame( shuffle = false ) {
		// Ставим пешки на обе стороны.
		for (let index = 0; index < 8; index++) {
			// Черные пешки.
			this.createFigure('pond', 1, index, 'b');
			// Белые пешки.
			this.createFigure('pond', 6, index);
		}

		// Первая и последняя линии с фигурами.
		const sideLine = ['rock','knight','bishop','queen','king','bishop','knight','rock'];

		// Нужно ли перемешать линии.
		if( shuffle ) {
			sideLine.sort(() => Math.random() - 0.5);
		}

		// Фактически создаем фигуры и ставим их на доску.
		sideLine.forEach( (figure, index) => {
			// Черные фигуры.
			this.createFigure(figure, 0, index, 'b');
			// Белые фигуры.
			this.createFigure(figure, 7, index);
		} );

		return this.cells;
	}

	/**
	 * Подготавливает фигуры для шахмат Фишера.
	 * 
	 * @returns {array}
	 */
	_initFisherChessGame() {
		return this._initClassicChessGame(true);
	}

	/**
	 * Полная подготовка и старт шахмат Фишера.
	 */
	startFisherGame(options = null) {
		this._clearGame(options);
		this._initFisherChessGame();
	}

	/**
	 * Полная подготовка и старт классических шахмат.
	 */
	startClassicGame(options = null) {
		this._clearGame(options);
		this._initClassicChessGame();
	}

	/**
	 * Обнуляет все параметры перед новой игрой.
	 */
	_clearGame(options = null) {
		this.pause();
		this._clearBoard();
		this._clearOptions(options);
		this._clearHistory();
		this._clearAttackCells();
	}

	/**
	 * Очищает доску.
	 */
	_clearBoard() {
		this.cells.forEach(row => {
			row.forEach(col => {
				_.merge(col, this._getEmptyCell());
			});
		});
	}

	/**
	 * Возвращает пустой шаблок клетки.
	 * 
	 * @returns {object}
	 */
	_getEmptyCell() {
		return {
			figure: null,
			checked: false,
			possible: false
		};
	}

	/**
	 * Создает и возвращает доску определенного размера.
	 * 
	 * @param {int} rows 
	 * @param {int} cols
	 * 
	 * @returns {array}
	 */
	_createBoard(rows = 8, cols = 8) {
		let cells = [];
		cells.length = rows * cols;
		cells.fill('');

		cells = cells.map(cell => {
			return this._wrapParameter(this._getEmptyCell());
		});

		this._updateBoardNumbers(rows, cols);

		return this.cells = _.chunk(cells, rows);
	}

	/**
	 * Обновляет массивы с обозначениями клеток.
	 * 
	 * @param {int} rows 
	 * @param {int} cols 
	 */
	_updateBoardNumbers(rows, cols) {
		// Буквы сверху.
		this.lettersArray = [];		
		for( let i = 0; i < cols; i++ ) {
			this.lettersArray.push( String.fromCharCode(65 + i) );
		}
		
		// Цифры слева.
		this.numbersArray = [];
		for( let i = 1; i <= rows; i++ ){
			this.numbersArray.unshift(i);
		}
	}

	/**
	 * Очищаем историю ходов.
	 */
	_initNewHistory() {
		this.history = this._wrapParameter([]);
	}

	/**
	 * Очищает историю ходов.
	 */
	_clearHistory() {
		this.history.length = 0;
	}

	/**
	 * Устанавливаем обертку для переменных.
	 * 
	 * @param {callable} wrapper
	 */
	static setWrapper(wrapper) {
		if( typeof wrapper === 'function' ) {
			Game.wrapper = wrapper;
		}
	}

	/**
	 * Устанавливаем колбэк для развертывания переменных.
	 * 
	 * @param {callable} unwrapper
	 */
	static setUnwrapper(unwrapper) {
		if( typeof unwrapper === 'function' ) {
			Game.unwrapper = unwrapper;
		}
	}

	/**
	 * Оборачивает параметр в обертку, если она задана.
	 * 
	 * @param {any} param 
	 * 
	 * @returns {any}
	 */
	_wrapParameter(param) {
		return typeof Game.wrapper == 'function' ? Game.wrapper(param) : param;
	}

	/**
	 * Разворачивает параметр.
	 * 
	 * @param {any} param 
	 * 
	 * @returns {any}
	 */
	_unwrapParameter(param) {
		return typeof Game.unwrapper == 'function' ? Game.unwrapper(param) : param;
	}

	/**
	 * Создаем новые настройки игры.
	 */
	_initNewOptions() {
		this.options = this._wrapParameter(this._getEmptyOptions());

		this._startingMoveTime = this.options.timers.w;
	}

	/**
	 * Сбрасывает опции игры.
	 */
	_clearOptions(options = null) {
		_.merge(this.options, this._getEmptyOptions());

		// Если заданы свои опции, то применям их.
		options && _.merge(this.options, options);

		this._startingMoveTime = this.options.timers.w;
	}

	/**
	 * Просто шаблонный объект для опций.
	 * 
	 * @returns {object}
	 */
	_getEmptyOptions() {
		return {
			move: 'w',
			turn: 1,
			timers: {
				w: 120000,
				b: 120000,
				add: 2000
			},
			paused: true,
			finished: false,
			freezed: false,
			winner: null
		};
	}

	/**
	 * Создает фигуру на доске.
	 * 
	 * @param {string} figure 
	 * @param {int} row 
	 * @param {int} col 
	 * @param {string} color 
	 * 
	 * @returns {boolean}
	 */
	createFigure(figure, row, col, color = 'w') {
		const factoryMethod = 'create' + figure.slice(0,1).toUpperCase() + figure.slice(1);

		// Проверяем существует ли фигура.
		if( !FigureFactory[factoryMethod] ) {
			return false;
		}

		// Фактически создаем фигуру и помещаем ее на поле.
		this.cells[row][col].figure = FigureFactory[factoryMethod]({
			row, col, color
		});

		return true;
	}

	/**
	 * Принимает все ответы дополнительных действий при ходах.
	 * 
	 * @param {any} answer
	 */
	specialMoveController(answer) {
		// Обрабатываем ответ.
		const modalContent = this._historyRow.figure[this.modalContent.method](this._historyRow, answer);

		// Если результат хода требует дополнительных действий.
		if( modalContent ) {
			// Запускаем коллбек.
			_.merge(this.modalContent, modalContent);

			return;
		}

		// Закрываем окно.
		this.modalContent.isOpen = false;

		// Размораживаем игру.
		this._unfreeze();

		// Завершаем ход.
		this._correctMoveEnding();
	}

	/**
	 * Ловим клик по клетке поля.
	 * 
	 * @param {int} row 
	 * @param {int} col 
	 */
	cellClickReaction(row, col) {
		// Если игра заморожена, то клики заблокированы.
		if( this.options.freeze ) {
			return;
		}

		// Выбираем ячейку, на которую кликнули.
		this._clickedCell = this.cells[row][col];

		// Если ячейка отмечена допустимым ходом, то делаем ход и выходим.
		if( this._clickedCell.possible ) {

			this._clearAttackCells();

			const modalContent = this._makeMove(row, col);

			// Если результат хода требует дополнительных действий.
			// (К примеру, нужно выбрать во что превратится пешка)
			if( modalContent ) {
				// Замораживаем игру до выполнения.
				this._freeze();

				// И запускаем коллбек.
				_.merge(this.modalContent, modalContent);
				this.modalContent.isOpen = true;

				return;
			}

			// Завершаем ход.
			return this._correctMoveEnding();
		}

		// Сохраняем была ли нажата фигура второй раз подряд.
		const isClickChecked = this._clickedCell.checked;

		// Отменяем выделение. Если дошло до этого места, то клик по неактивной области.
		this._uncheckOldFigure();

		// Если нужно было просто деактивировать фигуру повторным кликом, то завершаем.
		if( isClickChecked ) {
			return;
		}

		// Выделяем новую фигуру, если выбрана.
		this._checkNewFigure(row, col);
	}

	/**
	 * Меняем ход на следующего игрока.
	 */
	_updateNextPlayer() {
		this.options.move = this.options.move == 'w' ? 'b' : 'w';
		if(this.options.move == 'w') {
			this.options.turn++;
		}

		// Если стоит пауза, то после хода ее в любом случае снимаем.
		this.unpause();

		// Новый идентификатор хода.
		this.id++;
	}

	/**
	 * Меняем ход на предыдущего игрока.
	 */
	_updatePreviousPlayer() {
		this.options.move = this.options.move == 'w' ? 'b' : 'w';
		if(this.options.move == 'b') {
			this.options.turn--;
		}

		if(this.options.turn == 1 && this.options.move == 'w') {
			// Если возвращаем в самое начало игры, то ставим паузу.
			this.pause();
		} else {
			// В остальных случаях снимаем паузу.
			this.unpause();
		}

		// Новый идентификатор хода.
		this.id++;
	}

	/**
	 * Выполняем ход фигурой.
	 * 
	 * @param {int} row 
	 * @param {int} col
	 *  
	 * @returns
	 */
	_makeMove(row, col) {
		// Получаем старую ячейку с выбранной фигурой.
		const oldCell = this.cells[this._checkedCell.row][this._checkedCell.col];

		// Сбрасываем выделение.
		this._uncheckOldFigure();

		// Создаем новый экземпляр хода.
		this._historyRow = this._getNewHistoryElem(oldCell, this._clickedCell, row, col);

		// Делегируем ход самой фигуре.
		return oldCell.figure.makeMove(this._historyRow);
	}

	/**
	 * Завершает начатый ход.
	 */
	_correctMoveEnding() {
		// Добавляем дополнительное время после каждого хода.
		if( !this.options.paused ) {
			this.options.timers[this.options.move] += this.options.timers.add;
		}

		// Следующий игрок.
		this._updateNextPlayer();

		this._checkCheckAndMat();

		// Результат записываем в историю.
		this._pushRowToHistory(this._historyRow);
	}

	/**
	 * Проверяет есть ли атака на короля и есть ли возможные ходы.
	 */
	_checkCheckAndMat() {
		const isCheck = this._checkCheck();
		const isCanMove = this._checkCanMove();

		this._markAttackCells();

		if( isCheck ) {
			this._historyRow.mod = '+';

			if( !isCanMove ) {
				this._historyRow.mod = 'X';

				// Нет ходов с шахом. Победа.
				this.finish();
			}
		} else {
			if( !isCanMove ) {
				// Нет ходов без шаха. Ничья.
				this.finish(true);
			}
		}
	}

	/**
	 * Помечает атакуемые клетки цветом.
	 */
	_markAttackCells() {
		for (const attackCell of this._attackCells) {
			const cell = AbstractFigure.getObjectFromCellFormat(attackCell);

			this.cells[cell.row][cell.col].check = true;
		}
	}

	/**
	 * Обновляет атакуемые клетки цветом.
	 */
	_updateAttackCells() {
		this._clearAttackCells();
		this._markAttackCells();
	}

	/**
	 * Очищает массив атакуемых клеток, а также обновляет поле.
	 */
	_clearAttackCells() {
		for (const attackCell of this._attackCells) {
			const cell = AbstractFigure.getObjectFromCellFormat(attackCell);

			delete this.cells[cell.row][cell.col].check;
		}

		this._attackCells.clear();
	}

	/**
	 * Проверяет есть ли допустимые ходы. То есть такие, после которых не будет атаки своего короля.
	 * 
	 * @returns {boolean}
	 */
	_checkCanMove() {
		// Каждая строка.
		for( let i = 0; i < this.cells.length; i++ ) {
			const row = this.cells[i];

			// Каждая клетка.
			for( let y = 0; y < row.length; y++ ) {
				const col = row[y];

				// Если на клетке есть наша фигура.
				if( col.figure && col.figure.color == this.options.move ) {
					// Если фигура может ходить, то сразу возвращаем.
					if( col.figure.getAvailableMovesWithoutChecksAndAlly().length ) {
						return true;
					}
				}				
			}
		}

		// Если ни одна фигура не может ходить, то тогда ходов нет.
		return false;
	}

	/**
	 * Проверяет наличие шаха.
	 * 
	 * @returns {boolean}
	 */
	_checkCheck() {
		const moves = this.getAllAttackCells();

		let isCheck = false;

		for( let i = 0; i < moves.length; i++ ) {
			const move = AbstractFigure.getObjectFromCellFormat(moves[i]);

			if(
				this.cells[move.row] &&
				this.cells[move.row][move.col] &&
				this.cells[move.row][move.col].figure &&
				this.cells[move.row][move.col].figure.getName() == 'King' &&
				this.cells[move.row][move.col].figure.color == this.options.move
			) {
				isCheck = true;

				this._attackCells.add(moves[i]);
			}
		}

		return isCheck;
	}

	/**
	 * Возвращает последний активный ход.
	 * 
	 * @returns {object}
	 */
	getLastMove() {
		return this.history.findLast((row) => {
			return row.active;
		});
	}

	/**
	 * Возвращает шаблон объекта истории.
	 * 
	 * @param {object} oldCell 
	 * @param {object} clickedCell 
	 * @param {int} row 
	 * @param {int} col 
	 * 
	 * @returns
	 */
	_getNewHistoryElem(oldCell, clickedCell, row, col) {
		const historyRow = {
			// Фигура, которае делает ход.
			figure: oldCell.figure,
			// С какой клетки ходит.
			from: {
				row: oldCell.figure.row,
				col: oldCell.figure.col
			},
			// На какую клетку встает.
			to: {
				row: row,
				col: col
			},
			// Фигура, которую съели во время хода, если такая есть.
			attack : clickedCell.figure,
			// Дополнительные подификаторы хода. Такие как ШАХ или МАТ.
			mod: null,
			// Примерен ли данный объект истории.
			active: true
		};

		// Время начала хода.
		historyRow['time'] = this._startingMoveTime;

		// Устанавливаем текущий ход в объекте истории.
		historyRow['turn'] = this.options.turn;

		// Заранее вычисляем отображение хода.
		historyRow['view'] = this._convertFromToIntoCorrectView(historyRow['from'], historyRow['to']);

		return historyRow;
	}

	/**
	 * Записываем ход в историю.
	 * 
	 * @param {object} row 
	 */
	_pushRowToHistory(row) {
		// Сначала находим последний активный ход.
		const index = this.history.findIndex((el) => {
			return !el.active;
		});

		// Обрезаем историю, чтобы удалить отмененные ходы.
		index >= 0 && this.history.splice(index);

		// И сохраняем ход в обрезанную историю.
		this.history.push(row);
	}

	/**
	 * Собирает отображение хода.
	 * 
	 * @param {object} historyRow
	 * 
	 * @returns
	 */
	_convertFromToIntoCorrectView(from, to) {
		// Ход в формате A1 - H1.
		const view = [
			this.lettersArray[from.col],
			this.numbersArray[from.row],
			' - ',
			this.lettersArray[to.col],
			this.numbersArray[to.row]
		];

		// Возвращаем в виде строки.
		return view.join('');
	}

	/**
	 * Сбратываем выделение фигуры.
	 */
	_uncheckOldFigure() {
		// Если ни одна фигура не выбрана, то ничего не делаем.
		if ( this._checkedCell.row === null ) {
			return;
		}

		// Получаем старую ячейку с выбранной фигурой.
		const oldCell = this.cells[this._checkedCell.row][this._checkedCell.col];

		// Отменяем выделение.
		oldCell.figure.setInactive(this.cells);

		// Очищаем настройки.
		this._checkedCell.row = null;
	}

	/**
	 * Пробуем выбрать фигуру.
	 * 
	 * @param {int} row 
	 * @param {int} col 
	 */
	_checkNewFigure(row, col) {
		// Если выбрана фигура и она принадлежит игроку, который сейчас ходит.
		if( this._clickedCell.figure && this._clickedCell.figure.color === this.options.move ) {
			// Активируем фигуру.
			this._clickedCell.figure.setActive(this.cells);

			// Записываем в настройки новые координаты активированной фигуры.
			this._checkedCell.row = row;
			this._checkedCell.col = col;
		}
	}

}

export default Game
