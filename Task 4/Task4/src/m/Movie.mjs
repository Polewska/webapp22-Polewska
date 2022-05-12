/**
 * @fileOverview  The model class Movie with attribute definitions and storage management methods
 * @author Gerd Wagner
 * @copyright Copyright 2013-2014 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

 import Person from "./Person.mjs";
import {
  isNonEmptyString,
  cloneObject,
  isPositiveInteger
} from "../../lib/util.mjs";
import {
  NoConstraintViolation,
  MandatoryValueConstraintViolation,
  RangeConstraintViolation,
  UniquenessConstraintViolation,
  StringLengthConstraintViolation
} from "../../lib/errorTypes.mjs";

class Movie {
  constructor ({movieId, title, releaseDate, actors, actorIdRefs, director, directorId }) {
  this.movieId = movieId;
  this.title = title;
  this.releaseDate = releaseDate;
  this.director = director || directorId;
  if(actors || actorIdRefs){
    this.actors = actors || actorIdRefs;
  }
  }

  /***********************************************
 ***  geters   ************
 ***********************************************/
  get movieId(){
    return this._movieId;
  }

  get title(){
    return this._title;
  }

  get releaseDate(){
    return this._releaseDate;
  }

  get director(){
    return this._director;
  }

  get actors(){
    return this._actors;
  }
/***********************************************
 ***  setters    ************
 ***********************************************/
 set movieId(id) {
  const validationResult = Movie.checkMovieIdAsId(id);
  if (validationResult instanceof NoConstraintViolation) {
    this._movieId = id;
  } else {
    throw validationResult;
  }
}

set title(name) {
  const validationResult = Movie.checkTitle(name);
  if (validationResult instanceof NoConstraintViolation) {
    this._title = name;
  } else {
    throw validationResult;
  }
}

set releaseDate(date) {
  const validationResult = Movie.checkReleaseDate(date);
  if (validationResult instanceof NoConstraintViolation) {
    this._releaseDate = new Date (date);
  } else {
    throw validationResult;
  }
}

set director(direct) {
    // p can be an ID reference or an object reference
    const directorId = (typeof direct !== "object") ? direct : direct.personId;
    const validationResult = Movie.checkDirector(directorId);
    if (validationResult instanceof NoConstraintViolation) {
      // create the new publisher reference
      this._director = Person.instances[directorId];
    } else {
      throw validationResult;
    }
}
 
set actors(act) {
  this._actors = {};
  if (Array.isArray(act)) {  // array of IdRefs
    for (const idRef of act) {
      this.addActor(idRef);
    }
  } else {  // map of IdRefs to object references
    for (const idRef of Object.keys(act)) {
      this.addActor(act[idRef]);
    }
  }
}

/***********************************************
 ***  check functions   ************
 ***********************************************/
// Katarzyna: This function checks if the given value is a number or not (range constraint)
static checkMovieId (id) {
  if (!id) {
    return new NoConstraintViolation();
  } else if (!isPositiveInteger(id)) {
    return new RangeConstraintViolation("MovieId has to be a positive number");
  } else {
    return new NoConstraintViolation();
  }
};

// Katarzyna: This function checks if value of MovieId is given (mandetory constraint)
// and if the value is unique == not repeated in map (uniqueness constraint)
static checkMovieIdAsId (id) {
  let constraintViolation = Movie.checkMovieId(id);
  if (constraintViolation instanceof NoConstraintViolation) {
    if (!id) {
      constraintViolation = new MandatoryValueConstraintViolation(
        "A value for the MovieId must be provided"
      );
    } else if (Movie.instances[id]) {
      constraintViolation = new UniquenessConstraintViolation(
        "There is already a movie record with this MovieID"
      );
    } else {
      constraintViolation = new NoConstraintViolation();
    }
  }
  return constraintViolation;
};

// Katarzyna: This function checks if the title is given (mandetory)
// after that it is checked if the value is a non empty string (range constraint)
// and lastly the length is check with the rule that it should not be longer
// than 120 characters (string length constraint)
static checkTitle (name) {
  if (!name) {
    return new MandatoryValueConstraintViolation("A title must be provided!");
  } else if (!isNonEmptyString(name)) {
    return new RangeConstraintViolation("Title has to be a non-Empty string!");
  } else if (name.length > 120) {
    return new StringLengthConstraintViolation(
      "Title must not be longer then 120 characters"
    );
  } else {
    return new NoConstraintViolation();
  }
};
// Katarzyna: I have left the constraint on min. value
static checkReleaseDate = function (date) {
  if (!date) return new MandatoryValueConstraintViolation("A date must be provided!"); 
  return new NoConstraintViolation();
  
};

static checkDirector(directorId) {
  if(!directorId ){
    return new MandatoryValueConstraintViolation("Director must be named!");
  }
  const validationResult = Person.checkPersonIdAsIdRef(directorId);
  return validationResult;
}

static checkActor(actorId) {
  var validationResult = null;
  if (!actorId) {
    // actor(s) are optional
    validationResult = new NoConstraintViolation();
  } else {
    // invoke foreign key constraint check
    validationResult = Person.checkPersonIdAsIdRef(actorId);
  }
  return validationResult;
}

addActor(act) {
  // a can be an ID reference or an object reference
  const actorId = (typeof act !== "object") ? parseInt(act) : act.personId;
  if (actorId) {
    const validationResult = Movie.checkActor(actorId);
    if (actorId && validationResult instanceof NoConstraintViolation) {
      // add the new actor reference
      const key = String(actorId);
      this._actors[key] = Person.instances[key];
    } else {
      throw validationResult;
    }
  }
}

removeActor(act) {
  // a can be an ID reference or an object reference
  const actorId = (typeof act !== "object") ? parseInt(act) : act.personId;
  if (actorId) {
    const validationResult = Movie.checkActor(actorId);
    if (validationResult instanceof NoConstraintViolation) {
      // delete the actor reference
      delete this._actors[String(actorId)];
    } else {
      throw validationResult;
    }
  }
}


// Katarzyna: turnes movie Instance to string
toString () {
  var movieStr = `Movie{ movieId: ${this.movieId}, title: ${this.title}, 
                        releaseDate: ${this.releaseDate}, director: ${this.director.personId}`;
  if (this.actors) movieStr += `, actors: ${Object.keys( this.actors).join(",")} }`;
  return movieStr;
};

toJSON() {  // is invoked by JSON.stringify
  var rec = {};
  for (let p of Object.keys(this)) {
    // copy only property slots with underscore prefix
    if (p.charAt(0) !== "_") continue;
    switch (p) {
      case "_director":
        // convert object reference to ID reference
        rec.directorId = this.director.personId;
        break;
      case "_actors":
        // convert the map of object references to a list of ID references
        if (this._actors){ 
          rec.actorIdRefs = [];
          for (const actorsIdStr of Object.keys( this.actors)) {
          rec.actorIdRefs.push( parseInt(actorsIdStr));
        }}
        break;
      default:
        // remove underscore prefix
        rec[p.substr(1)] = this[p];
      }
    }
    return rec;
  }
}
/**********************************************************
 ***  Class-level ("static") properties  ******************
 **********************************************************/

// initially an empty collection (in the form of a map)
Movie.instances = {};

/*********************************************************
 ***  Class-level ("static") storage management methods ***
 **********************************************************/

// Add a Movie to the map
Movie.add = function (slots) {
  let movie = null;
  try {
    movie = new Movie(slots);
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    movie = null;
  }
  if (movie) {
    Movie.instances[movie.movieId] = movie;
    console.log(`${movie.toString()} created!`);
  }
};
/**
 *  Update an existing movie row
 */
Movie.update = function ({movieId, title, releaseDate, actorsIdRefsToAdd, actorsIdRefsToRemove, directorId}) {
  var noConstraintViolated = true;
  var updateProperties = [];
  const movie = Movie.instances[movieId],
    objectBeforeUpdate = cloneObject(movie);
    // Katarzyna: it firstly checks if anything has been change in the old wvalue both for
    // the title as well as release Date
  try {
    if (movie.title !== title) {
      movie.title = title;
      updateProperties.push("title");
    }
    if (movie.releaseDate.toLocaleDateString("en-EN") !== new Date(releaseDate).toLocaleDateString("en-EN")){
      movie.releaseDate =releaseDate;
        updateProperties.push("releaseDate");
    }
    // NOT SURE IF THIS WILL WORK
    if (parseInt(movie.director.personId) !== parseInt(directorId)) {
      console.log(`${movie.director.personId} and ${directorId}`)
      movie.director = directorId;
      updateProperties.push("director");
    }
    if (actorsIdRefsToAdd) {
      updateProperties.push("actors(added)");
      for (const actorIdRef of actorsIdRefsToAdd) {
        movie.addActor(actorIdRef);
      }
    }
    if (actorsIdRefsToRemove) {
      updateProperties.push("actors(removed)");
      for (const actor_id of actorsIdRefsToRemove) {
        movie.removeActor(actor_id);
      }
    }
    
  } catch (e) {
    console.log(`${e.constructor.name}: ${e.message}`);
    noConstraintViolated = false;
    // restore object to its state before updating
    Movie.instances[movieId] = objectBeforeUpdate;
  }
  if (noConstraintViolated) {
    if (updateProperties.length > 0) {
      let ending = updateProperties.length > 1 ? "ies" : "y";
      console.log(
        `Propert${ending} ${updateProperties.toString()} modified for movie ${movieId}`);
    } else {
      console.log(`No property value changed for movie ${movie.movieId}!`);
    }
  }
};
/**
 *  Delete a movie
 */
Movie.destroy = function (movieId) {
  if (Movie.instances[movieId]) {
    console.log(`${Movie.instances[movieId].toString()} deleted`);
    delete Movie.instances[movieId];
  } else {
    console.log(`There is no movie with movieId ${movieId} in the database!`);
  }
};

/**
 *  Load all movie table rows and convert them to objects
 */
Movie.retrieveAll = function () {
  var movies = {};
  try {
    if (!localStorage["movies"]) {
      localStorage["movies"] = "{}";
    }else{
      movies = JSON.parse( localStorage["movies"]);
      console.log(`${Object.keys(movies).length} movie records loaded.`);
    }
  } catch (e) {
    alert("Error when reading from Local Storage\n" + e);
  }
  for (const movieId of Object.keys(movies)) {
    try {
      Movie.instances[movieId] = new Movie(movies[movieId]);
    } catch (e) {
      console.log(`${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`);
    }
  }
};
/**
 *  Save all mvoie objects
 */
Movie.saveAll = function () {
  var error = false;
  var moviesString = "";
  const nmrOfMovies = Object.keys(Movie.instances).length;
  try {
    moviesString = JSON.stringify(Movie.instances);
    console.log(`${moviesString}`)
    localStorage["movies"] = moviesString;
  } catch (e) {
    alert("Error when writing to Local Storage\n" + e);
    error = true;
  }
  if (!error) {
    console.log(`${nmrOfMovies} movies saved.`);
  }
};

export default Movie;
