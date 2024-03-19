# Movie-Database-COMP-2406
Final project for COMP 2406, Winter 2021 (Owen Brouse 101156580, Robert Babaev 101143382)

## Initialization and setup
There are three commands in order to get the server configured and running properly. 

```
npm install
```

This command will install Pug, and later on Express, MondoDB, Mongoose, and any other materials needed.

```
npm run datagen
```

This command will initialize the data from the provided movie-data folder alongside other necessary data, separating it into JSON files. 

```
npm start
```

Lastly, this command will run the actual server itself.

## Testing

All necessary routes are in place for testing, and the only one that should be manually navigated to is localhost:3000.

As for actual testing, here is a suggested path:
- Go to localhost:3000
- Click on any movie in the lists
- Click on any user in the reviews section (if there are any)
- If there are no reviews for the example movie, run the datagen script again, chances are some reviews will populate for
the example film.
- Click on Login
- Click on Profile
- Click on any followed person in the Followed People tab
- Click back on the Profile
- Click on add movie and add person in the Manage tab
- Type in "Go" in the movie search bar and hit "Search"
- Search for some names or genres in the search bars

Note: Object outline is located as the file ``COMP 2406 Project Check In.pdf``

Further Note: Some code snippets come from w3Schools, and are solely for aesthetic organization.
