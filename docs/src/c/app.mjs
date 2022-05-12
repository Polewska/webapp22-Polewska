/**
 * @fileOverview  Auxiliary data management procedures
 * @author Gerd Wagner
 */
import Person from "../m/Person.mjs";
import Movie from "../m/Movie.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Create and save test data
 */

function generateTestData() {
  try{
  Person.instances["1"] = new Person({
    personId: 1,
    name: "Stephen Frears"
  });
  Person.instances["2"] = new Person({
    personId: 2,
    name: "George Lucas"
  });
  Person.instances["3"] = new Person({
    personId: 3,
    name: "Quentin Tarantino"
  });
  Person.instances["5"] = new Person({
    personId: 5,
    name: "Uma Thurman"
  });
  Person.instances["6"] = new Person({
    personId: 6,
    name: "John Travolta"
  });
  Person.instances["7"] = new Person({
    personId: 7,
    name: "Ewan McGregor"
  });
  Person.instances["8"] = new Person({
    personId: 8,
    name: "Natalie Portman"
  });
  Person.instances["9"] = new Person({
    personId: 9,
    name: "Keanu Reeves"
  });
  Person.saveAll();
  Movie.instances["1"] = new Movie({
    movieId: 1,
    title: "Pulp Fiction",
    releaseDate: new Date("05/12/1994"),
    directorId: 3,
    actorIdRefs: [5,6]
  });
  Movie.instances["2"] = new Movie({
    movieId: 2,
    title: "Star Wars",
    releaseDate: new Date("05/25/1977"),
    directorId: 2,
    actorIdRefs: [7,8]
  });
  Movie.instances["3"] = new Movie({
    movieId: 3,
    title: "Dangerous Liaisons",
    releaseDate: new Date("12/16/1988"),
    directorId: 1,
    actorIdRefs: [9,5]
  });
  Movie.saveAll();
}catch(e){
  console.log( `${e.constructor.name}: ${e.message}`);
}
};
/**
 * Clear data
 */
function clearData () {
  if (confirm("Do you really want to delete all movie data?")) {
    try {
      Person.instances = {};
      localStorage["person"] = "{}";
      Movie.instances = {};
      localStorage["movies"] = "{}";
      console.log("All data cleared.");
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
    }
  }
};

export { generateTestData, clearData };
