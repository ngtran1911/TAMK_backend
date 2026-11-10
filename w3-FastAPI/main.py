from fastapi import FastAPI, HTTPException
from pydantic import BaseModel   # 1. import BaseModel

app = FastAPI()

# Movie data
movies = [
    {"id": 1, "title": "Inception", "year": 2010, "genre": "Sci-Fi"},
    {"id": 2, "title": "The Matrix", "year": 1999, "genre": "Sci-Fi"},
    {"id": 3, "title": "Parasite", "year": 2019, "genre": "Thriller"},
]

# 2. class name + (BaseModel)
class MovieCreate(BaseModel):
    title: str
    director: str
    year: int

class MovieUpdate(BaseModel):
    title: str | None = None
    director: str | None = None
    year: int | None = None

def find_movie_index(movie_id: int):
    for index, movie in enumerate(movies):
        if movie["id"] == movie_id:
            return index
        return None

@app.get("/")
def root():
    return {
        "message": "Hello from FastAPI"
    }


@app.get("/hello/{name}/")
def hello(name:str):
    return{
        "mes" : f"Hello {name}"
    }

@app.get("/movies/")
def get_movies(): 
    return movies


@app.get("/movies/{movie_id}")
def get_movies(movie_id : int): 
    for movie in movies:
        if movie["id"] == movie_id:
            return movie
    #error using httpexception   
    raise HTTPException(
        status_code = 404,
        detail ="movie not found"
    )

#implement post and data validation using pydantic
@app.post("/movies", status_code=201)
def create_movie(movie: MovieCreate): # The Rest para must match the data from the pydantic class
    new_id = max(
        movie["id"]
        for movie in movies
    ) + 1

    new_movie = {
        "id" : new_id,
        **movie.model_dump() #turn pydantic obj into normal JS obj
    }

    movies.append(new_movie)
    return new_movie


#PUT : replace whole movie
@app.put("/movies/{movie_id}")
def replace_movie( movie_id: int,replacement : MovieCreate):

#helper func to find a movie from our local in memory data
    index = find_movie_index(movie_id)

    if index is None :
        raise HTTPException(status_code=404, detail="Movie not found")
    
    updated_movie = { #build the new movie
        "id" : movie_id,
        **replacement.model_dump(),
    }
    movies[index] = updated_movie
    return updated_movie;

#PATCH : update some fields has a 
@app.patch("/movies/{movie_id}")
def update_movie(movie_id: int, changes: MovieUpdate):          # which model?
    index = find_movie_index(movie_id)

    if index is None:
        raise HTTPException(status_code=404, detail="Movie not found")

    # only the fields the client actually sent
    sent_fields = changes.model_dump(exclude_unset=True)           # the hint from the assignment

    # merge them into the existing movie
    movies[index].update(sent_fields)                     # dict method: "make newer"

    return movies[index]

#delete
@app.delete("/movies/{movie_id}", status_code=204)
def delete_movie(movie_id:int):
    index = find_movie_index(movie_id)

    if index is None:
            raise HTTPException(status_code=404, detail="Movie not found")

    movies.pop(index)


#query parameter GET /movies?min_year=2000
@app.get("/movies")
def get_movies(
    min_year: int | None = None
):
    result = movies

    if min_year is not None:
        result = [
            movie
            for movie in result
            if movie["year"] >= min_year
        ]

    return result

#query parameter GET /movies?director=nolan
@app.get("/movies")
def get_movies(
    director: str | None = None
):
    result = movies
    if director is not None:
        result = [
            movie 
            for movie in result
            if director.lower() in movie["director"].lower
        ]
    return result
