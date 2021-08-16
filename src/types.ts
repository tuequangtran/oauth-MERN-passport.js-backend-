
//interface for user object
export interface IUser {
	googleId?: string;
	twitterId?: string;
	githubId?: string;
	username: string;
}

//interface for mongodb user object
export interface IMongoDBUser {
	googleId?: string;
	twitterId?: string;
	githubId?: string;
	username: string;
	__v: number;
	_id: string;
}
