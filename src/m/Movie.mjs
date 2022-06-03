/**
 * @fileOverview  The model class Movie with attribute definitions and storage management methods
 * @author Gerd Wagner
 * @copyright Copyright 2013-2014 Gerd Wagner, Chair of Internet Technology, Brandenburg University of Technology, Germany.
 * @license This code is licensed under The Code Project Open License (CPOL), implying that the code is provided "as-is",
 * can be modified to create derivative works, can be redistributed, and can be used in commercial applications.
 */

import Person from "./Person.mjs";
import Actor from "./Actor.mjs";
import Director from "./Director.mjs";
import {
  isNonEmptyString,
  cloneObject,
  isPositiveInteger,
} from "../../lib/util.mjs";
import {
  NoConstraintViolation,
  ConstraintViolation,
  MandatoryValueConstraintViolation,
  RangeConstraintViolation,
  UniquenessConstraintViolation,
  StringLengthConstraintViolation,
  FrozenValueConstraintViolation,
} from "../../lib/errorTypes.mjs";

import Enumeration from "../../lib/Enumeration.mjs";
/**
 * Enumeration type
 * @global
 */
const MovieCategoryEL = new Enumeration(["TvSeriesEpisode", "Biography"]);

class Movie {
  constructor({
    movieId,
    title,
    releaseDate,
    actors,
    actorIdRefs,
    director,
    directorId,
    category,
    episodeNo,
    tvSeriesName,
    about,
    aboutId,
  }) {
    this.movieId = movieId;
    this.title = title;
    this.releaseDate = releaseDate;
    this.director = director || directorId;
    if (actors || actorIdRefs) {
      this.actors = actors || actorIdRefs;
    }
    if (category) this.category = category; // being incomplete, these properties are optional
    if (episodeNo) this.episodeNo = episodeNo;
    if (tvSeriesName) this.tvSeriesName = tvSeriesName;
    if (about) this.about = about || aboutId; // about is reference to person
  }

  /***********************************************
   ***  geters   ************
   ***********************************************/
  get movieId() {
    return this._movieId;
  }

  get title() {
    return this._title;
  }

  get releaseDate() {
    return this._releaseDate;
  }

  get director() {
    return this._director;
  }

  get actors() {
    return this._actors;
  }

  get category() {
    return this._category;
  }

  get episodeNo() {
    return this._episodeNo;
  }

  get tvSeriesName() {
    return this._tvSeriesName;
  }

  get about() {
    return this._about;
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
      this._releaseDate = new Date(date);
    } else {
      throw validationResult;
    }
  }

  set director(direct) {
    // p can be an ID reference or an object reference
    const directorId = typeof direct !== "object" ? direct : direct.personId;
    const validationResult = Movie.checkDirector(directorId);
    if (validationResult instanceof NoConstraintViolation) {
      // create the new director reference
      this._director = Director.instances[directorId];
    } else {
      throw validationResult;
    }
  }

  set actors(act) {
    this._actors = {};
    if (Array.isArray(act)) {
      // array of IdRefs
      for (const idRef of act) {
        this.addActor(idRef);
      }
    } else {
      // map of IdRefs to object references
      for (const idRef of Object.keys(act)) {
        this.addActor(act[idRef]);
      }
    }
  }

  set category(v) {
    var validationResult = null;
    if (!this.category) {
      v = parseInt(v);
      validationResult = Movie.checkCategory(v);
    }
    if (validationResult instanceof NoConstraintViolation) {
      this._category = v;
    } else {
      throw validationResult;
    }
  }

  set episodeNo(num) {
    const validationResult = Movie.checkEpisodeNo(num, this.category);
    if (validationResult instanceof NoConstraintViolation) {
      this._episodeNo = num;
    } else {
      throw validationResult;
    }
  }

  set tvSeriesName(name) {
    const validationResult = Movie.checkTvSeriesName(name, this.category);
    if (validationResult instanceof NoConstraintViolation) {
      this._tvSeriesName = name;
    } else {
      throw validationResult;
    }
  }

  set about(ab) {
    // ab can be an ID reference or an object reference
    //const abId = (typeof ab !== "object") ? ab : ab.personId;
    const validationResult = Movie.checkAbout(ab);
    if (validationResult instanceof NoConstraintViolation) {
      // create new about person reference
      this._about = ab;
    } else {
      throw validationResult;
    }
  }

  /***********************************************
   ***  check functions   ************
   ***********************************************/
  // Katarzyna: This function checks if the given value is a number or not (range constraint)
  static checkMovieId(id) {
    if (!id) {
      return new MandatoryValueConstraintViolation(
        "A value for the MovieId must be provided"
      );
    } else if (!isPositiveInteger(id)) {
      return new RangeConstraintViolation(
        "MovieId has to be a positive number"
      );
    } else {
      return new NoConstraintViolation();
    }
  }

  // Katarzyna: This function checks if value of MovieId is given (mandetory constraint)
  // and if the value is unique == not repeated in map (uniqueness constraint)
  static checkMovieIdAsId(id) {
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
  }

  // Katarzyna: This function checks if the title is given (mandetory)
  // after that it is checked if the value is a non empty string (range constraint)
  // and lastly the length is check with the rule that it should not be longer
  // than 120 characters (string length constraint)
  static checkTitle(name) {
    if (!name) {
      return new MandatoryValueConstraintViolation("A title must be provided!");
    } else if (!isNonEmptyString(name)) {
      return new RangeConstraintViolation(
        "Title has to be a non-Empty string!"
      );
    } else if (name.length > 120) {
      return new StringLengthConstraintViolation(
        "Title must not be longer then 120 characters"
      );
    } else {
      return new NoConstraintViolation();
    }
  }
  // Katarzyna: I have left the constraint on min. value
  static checkReleaseDate = function (date) {
    if (!date)
      return new MandatoryValueConstraintViolation("A date must be provided!");
    return new NoConstraintViolation();
  };

  static checkDirector(directorId) {
    if (!directorId) {
      return new MandatoryValueConstraintViolation("Director must be named!");
    }
    const validationResult = Director.checkDirectorIdAsIdRef(directorId);
    return validationResult;
  }

  static checkActor(actorId) {
    var validationResult = null;
    if (!actorId) {
      // actor(s) are optional
      validationResult = new NoConstraintViolation();
    } else {
      // invoke foreign key constraint check
      validationResult = Actor.checkActorIdAsIdRef(actorId);
    }
    return validationResult;
  }

  static checkCategory(v) {
    if (!v) {
      return new NoConstraintViolation();
    } else {
      if (!Number.isInteger(v) || v < 1 || v > MovieCategoryEL.MAX) {
        return new RangeConstraintViolation(
          "The value of category must be representing a movie type!"
        );
      } else {
        return new NoConstraintViolation();
      }
    }
  }
  // is optional so no mendatory check
  static checkEpisodeNo(id, c) {
    const cat = parseInt(c);
    if (!id) {
      return new MandatoryValueConstraintViolation(
        "An Episode number must be provided!"
      );
    } else if (cat !== MovieCategoryEL.TVSERIESEPISODE && id) {
      return new ConstraintViolation(
        "An episode number must not " +
          "be provided if the movie is not a tv series episode!"
      );
    } else if (!isPositiveInteger(id)) {
      return new RangeConstraintViolation(
        "EpisodeNo has to be a positive number"
      );
    } else {
      return new NoConstraintViolation();
    }
  }

  static checkTvSeriesName(name, c) {
    const cat = parseInt(c);
    if (!name) {
      return new MandatoryValueConstraintViolation("A title must be provided!");
    } else if (cat !== MovieCategoryEL.TVSERIESEPISODE && name) {
      return new ConstraintViolation(
        "A tv series Name must not " +
          "be provided if the movie is not a tv series episode!"
      );
    } else if (name && (typeof name !== "string" || name.trim() === "")) {
      return new RangeConstraintViolation(
        "The tv series name must be a non-empty string!"
      );
    } else {
      return new NoConstraintViolation();
    }
  }

  static checkAbout(aboutId) {
    const validationResult = Person.checkPersonIdAsIdRef(aboutId);
    if (!aboutId) {
      return new MandatoryValueConstraintViolation(
        "person about this biography is has to be provided !"
      );
    } else {
      return validationResult;
    }
  }

  addActor(act) {
    // a can be an ID reference or an object reference
    const actorId = typeof act !== "object" ? parseInt(act) : act.personId;
    if (actorId) {
      const validationResult = Movie.checkActor(actorId);
      if (actorId && validationResult instanceof NoConstraintViolation) {
        // add the new actor reference
        const key = String(actorId);
        this._actors[key] = Actor.instances[key];
      } else {
        throw validationResult;
      }
    }
  }

  removeActor(act) {
    // a can be an ID reference or an object reference
    const actorId = typeof act !== "object" ? parseInt(act) : act.personId;
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
  toString() {
    var movieStr = `Movie{ movieId: ${this.movieId}, title: ${this.title}, 
                      releaseDate: ${this.releaseDate}, director: ${this.director.personId}`;
    if (this.actors)
      movieStr += `, actors: ${Object.keys(this.actors).join(",")} }`;
    switch (this.category) {
      case MovieCategoryEL.TVSERIESEPISODE:
        movieStr += `, tv Series episode Name: ${this.tvSeriesName}`;
        movieStr += `, episode number: ${this.episodeNo}`;
        break;
      case MovieCategoryEL.BIOGRAPHY:
        movieStr += `, biography about: ${this.about}`;
        break;
    }
    return movieStr + "}";
  }

  toJSON() {
    // is invoked by JSON.stringify
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
          if (this._actors) {
            rec.actorIdRefs = [];
            for (const actorsIdStr of Object.keys(this.actors)) {
              rec.actorIdRefs.push(parseInt(actorsIdStr));
            }
          }
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

Movie.update = function ({
  movieId,
  title,
  releaseDate,
  actorsIdRefsToAdd,
  actorsIdRefsToRemove,
  directorId,
  category,
  tvSeriesName,
  episodeNo,
  aboutId,
}) {
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
    if (
      movie.releaseDate.toLocaleDateString("en-EN") !==
      new Date(releaseDate).toLocaleDateString("en-EN")
    ) {
      movie.releaseDate = releaseDate;
      updateProperties.push("releaseDate");
    }
    if (parseInt(movie.director.personId) !== parseInt(directorId)) {
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
    if (category) {
      if (!movie.category) {
        movie.category = parseInt(category);
        updateProperties.push("category");
      } else if (category !== movie.category) {
        throw new FrozenValueConstraintViolation(
          "The movie category must not be changed!"
        );
      }
    } else if (category === "" && "category" in movie) {
      throw new FrozenValueConstraintViolation(
        "The movie category must not be unset!"
      );
    }
    // only if category is equal to TvSeriesEpisode then an episode can be added
    if (episodeNo && movie.episodeNo !== episodeNo) {
      updateProperties.push("episodeNo");
      movie.episodeNo = episodeNo;
    }
    if (tvSeriesName && movie.tvSeriesName !== tvSeriesName) {
      updateProperties.push("tvSeriesName");
      movie.tvSeriesName = tvSeriesName;
    }
    if (aboutId && movie.aboutId !== aboutId) {
      movie.about = aboutId;
      updateProperties.push("about");
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
        `Propert${ending} ${updateProperties.toString()} modified for movie ${movieId}`
      );
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
    } else {
      movies = JSON.parse(localStorage["movies"]);
    }
  } catch (e) {
    alert("Error when reading from Local Storage\n" + e);
  }
  for (const movieId of Object.keys(movies)) {
    try {
      Movie.instances[movieId] = new Movie(movies[movieId]);
    } catch (e) {
      console.log(
        `${e.constructor.name} while deserializing movie ${movieId}: ${e.message}`
      );
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
export { MovieCategoryEL };
