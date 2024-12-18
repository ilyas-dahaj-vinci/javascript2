import express from "express";
import { Movie, NewMovie } from "../types";
import { filterMoviesByAttribute } from "../utils/filterMovies";
import { paginateMovies } from "../utils/pagination";

const router = express.Router();

const defaultMovies: Movie[] = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    duration: 148,
    budget: 160, // en millions
    description: "Un film de science-fiction sur les rêves et la réalité",
    imageUrl: "https://example.com/inception.jpg",
  },
  {
    id: 2,
    title: "Interstellar",
    director: "Christopher Nolan",
    duration: 169,
    budget: 165, // en millions
    description: "Un voyage à travers l'espace et le temps",
    imageUrl: "https://example.com/interstellar.jpg",
  },
  {
    id: 3,
    title: "The Dark Knight",
    director: "Christopher Nolan",
    duration: 152,
    budget: 185, // en millions
    description: "Batman contre le Joker",
    imageUrl: "https://example.com/darkknight.jpg",
  },
  {
    id: 4,
    title: "Pulp Fiction",
    director: "Quentin Tarantino",
    duration: 154,
    budget: 8, // en millions
    description: "Un film culte avec une narration non linéaire",
    imageUrl: "https://example.com/pulpfiction.jpg",
  },
  {
    id: 5,
    title: "The Matrix",
    director: "Lana Wachowski, Lilly Wachowski",
    duration: 136,
    budget: 63, // en millions
    description: "Un film révolutionnaire sur la réalité virtuelle",
    imageUrl: "https://example.com/matrix.jpg",
  },
];

// GET /films - Lecture de tous les films avec filtrage et pagination
router.get("/", (req, res) => {
  const minDuration = req.query["minimum-duration"];
  const startsWith = req.query["startsWith"];
  const director = req.query["director"];
  const minBudget = req.query["minimum-budget"];
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  let filteredMovies = defaultMovies;

  // Filtre par durée minimale
  if (minDuration) {
    const dureeMin = Number(minDuration);
    if (isNaN(dureeMin) || dureeMin <= 0) {
      return res.status(400).json({ error: "Durée minimale invalide" });
    }
    filteredMovies = filteredMovies.filter(
      (movie) => movie.duration >= dureeMin
    );
  }

  // Filtre par titre
  if (startsWith) {
    filteredMovies = filterMoviesByAttribute(
      filteredMovies,
      "title",
      startsWith
    );
  }

  // Filtre par directeur
  if (director) {
    filteredMovies = filterMoviesByAttribute(
      filteredMovies,
      "director",
      director
    );
  }

  // Filtre par budget minimum
  if (minBudget) {
    const budgetMin = Number(minBudget);
    if (isNaN(budgetMin) || budgetMin <= 0) {
      return res.status(400).json({ error: "Budget minimum invalide" });
    }
    filteredMovies = filteredMovies.filter((movie) => movie.budget !== undefined && movie.budget >= budgetMin);
  }

  // Pagination
  filteredMovies = paginateMovies(filteredMovies, page, limit);

  return res.json({
    currentPage: page,
    totalPages: Math.ceil(filteredMovies.length / limit),
    totalMovies: filteredMovies.length,
    movies: filteredMovies,
  });
});

// GET /films/:id - Lecture d'un film par ID
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: "ID invalide" });
  }

  const movie = defaultMovies.find((movie) => movie.id === id);
  if (!movie) {
    return res.status(404).json({ error: "Film non trouvé" });
  }

  return res.json(movie);
});

// POST /films - Création d'un film
router.post("/", (req, res) => {
  const body: unknown = req.body;

  // Validation des données reçues
  if (
    !body ||
    typeof body !== "object" ||
    !("title" in body) ||
    !("director" in body) ||
    !("duration" in body) ||
    !("budget" in body) ||
    !("description" in body) ||
    !("imageUrl" in body) ||
    typeof body.title !== "string" ||
    typeof body.director !== "string" ||
    typeof body.duration !== "number" ||
    typeof body.budget !== "number" ||
    typeof body.description !== "string" ||
    typeof body.imageUrl !== "string" ||
    !body.title.trim() ||
    !body.director.trim() ||
    !body.description.trim() ||
    !body.imageUrl.trim() ||
    body.duration <= 0 ||
    body.budget <= 0
  ) {
    return res.status(400).json({ error: "Données de film invalides" });
  }

  const newMovie = body as NewMovie;

  // Vérification si le film existe déjà
  const movieExists = defaultMovies.some(
    (movie) =>
      movie.title === newMovie.title && movie.director === newMovie.director
  );
  if (movieExists) {
    return res.status(409).json({ error: "Film déjà existant" });
  }

  // Création du film
  const nextId =
    defaultMovies.reduce(
      (maxId, movie) => (movie.id > maxId ? movie.id : maxId),
      0
    ) + 1;

  const addedMovie: Movie = {
    id: nextId,
    ...newMovie,
  };

  defaultMovies.push(addedMovie);
  return res.status(201).json(addedMovie);
});

export default router;
