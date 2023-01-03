import Knight from './knight';
import King from './king';
import Pond from './pond';
import Rock from './rock';
import Bishop from './bishop';
import Queen from './queen';

const figureFactory = {
	createKnight(options = {}) {
		return new Knight(options);
	},

	createKing(options = {}) {
		return new King(options);
	},

	createPond(options = {}) {
		return new Pond(options);
	},

	createRock(options = {}) {
		return new Rock(options);
	},

	createBishop(options = {}) {
		return new Bishop(options);
	},

	createQueen(options = {}) {
		return new Queen(options);
	}
};

export default figureFactory