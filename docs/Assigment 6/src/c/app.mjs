/**
 * @fileOverview  Auxiliary data management procedures
 * @author Gerd Wagner
 */
import Person from "../m/Person.mjs";
import Actor from "../m/Actor.mjs";
import Director from "../m/Director.mjs";
import Movie, {MovieCategoryEL} from "../m/Movie.mjs";

/*******************************************
 *** Auxiliary methods for testing **********
 ********************************************/
/**
 *  Create and save test data
 */

function generateTestData() {
  try{
    Director.instances["1"] = new Director({
      personId: 1,
      name: "Stephen Frears"
    });
    Director.instances["2"] = new Director({
      personId: 2,
      name: "George Lucas"
    });
    Director.instances["3"] = new Director({
      personId: 3,
      name: "Quentin Tarantino"
    });
    Actor.instances["3"] = new Actor({
      personId: 3,
      name: "Quentin Tarantino"
    });
    Actor.instances["5"] = new Actor({
      personId: 5,
      name: "John Travolta"
    });
    Actor.instances["6"] = new Actor({
      personId: 6,
      name: "Ewan McGregor"
    });
    Actor.instances["7"] = new Actor({
      personId: 7,
      name: "Natalie Portman"
    });
    Actor.instances["9"] = new  Actor({
      personId: 9,
      name: "Russell Crowe"
    });
    Director.instances["9"] = new Director({
      personId: 9,
      name: "Russell Crowe"
    });
    Actor.instances["10"] = new Actor({
      personId: 10,
      name: "Seth MacFarlane"
    });
    Actor.instances["11"] = new Actor({
      personId: 11,
      name: "Naomi Watts"
    });
    Director.instances["13"] = new Director({
      personId: 13,
      name: "Marc Forster"
    });
    Person.instances["14"] = new Person({
      personId: 14,
      name: "John Forbes Nash"
    });
    Person.instances["15"] = new Person({
      personId: 15,
      name: "John Doe"
    });
    Person.instances["16"] = new Person({
      personId: 16,
      name: "Jane Doe"
    });
    Person.saveAll();
    Actor.instances["12"] = new Actor({
      personId: 12,
      name: "Ed Harris",
      agentId: 15
    });
    Actor.instances["4"] = new Actor({
      personId: 4,
      name: "Uma Thurman",
      agentId: 15
    });
    Actor.instances["8"] = new Actor({
      personId: 8,
      name: "Keanu Reeves",
      agentId: 16
    });
    Actor.saveAll();
    Director.saveAll();


  Movie.instances["1"] = new Movie({
    movieId: 1,
    title: "Pulp Fiction",
    releaseDate: new Date("05/12/1994"),
    directorId: 3,
    actorIdRefs: [3,4,5]
  });
  Movie.instances["2"] = new Movie({
    movieId: 2,
    title: "Star Wars",
    releaseDate: new Date("05/25/1977"),
    directorId: 2,
    actorIdRefs: [6,7]
  });
  Movie.instances["3"] = new Movie({
    movieId: 3,
    title: "Dangerous Liaisons",
    releaseDate: new Date("12/16/1988"),
    directorId: 1,
    actorIdRefs: [8,4]
  });
  Movie.instances["4"] = new Movie({
    movieId: 4,
    title: "2015",
    releaseDate: new Date("06/30/2019"),
    directorId: 1,
    actorIdRefs: [9,10,11],
    category: MovieCategoryEL.TVSERIESEPISODE,
    episodeNo: 6,
    tvSeriesName: "The Loudest Voice"
  });
  Movie.instances["5"] = new Movie({
    movieId: 5,
    title: "A Beautiful Mind",
    releaseDate: new Date("12/21/2001"),
    directorId: 1,
    actorIdRefs: [9,12],
    category: MovieCategoryEL.BIOGRAPHY,
    about: 14
  });
  Movie.instances["6"] = new Movie({
    movieId: 6,
    title: "Stay",
    releaseDate: new Date("09/24/2005"),
    directorId: 1,
    actorIdRefs: [6,11]
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
      Actor.instances = {};
      localStorage["actor"] = "{}";
      Director.instances = {};
      localStorage["director"] = "{}";
      Movie.instances = {};
      localStorage["movies"] = "{}";
      console.log("All data cleared.");
    } catch (e) {
      console.log(`${e.constructor.name}: ${e.message}`);
    }
  }
};

export { generateTestData, clearData };
