-- specs/five-books.md Phase 2: run on a COPY of the data, before the FavouriteBooksList migration.
-- Saves what the showcases and favourite authors look like, in a schema fb_check, for after.sql to compare.
-- Read-only on the app's tables.
DROP SCHEMA IF EXISTS fb_check CASCADE;
CREATE SCHEMA fb_check;

-- Each showcased book, and whether the reader has a Read log of it everyone may see (Status 2 = Read,
-- ReadingVisibility 0 = Public): only those go into the Favourite books list.
CREATE TABLE fb_check.showcase AS
SELECT f."UserId", f."BookId", f."ShowcasePosition",
       EXISTS (SELECT 1 FROM "Logs" l
               WHERE l."UserId" = f."UserId" AND l."BookId" = f."BookId"
                 AND l."Status" = 2 AND l."ReadingVisibility" = 0) AS public_read
FROM "FavouriteBooks" f
WHERE f."ShowcasePosition" IS NOT NULL;

CREATE TABLE fb_check.hearts AS SELECT "UserId", "BookId", "CreatedAt" FROM "FavouriteBooks";
CREATE TABLE fb_check.authors AS SELECT "UserId", "AuthorId", "CreatedAt" FROM "FavouriteAuthors";
CREATE TABLE fb_check.lists AS SELECT "Id", "Type" FROM "BookLists";
CREATE TABLE fb_check.items AS SELECT "Id" FROM "ListItems";

SELECT
    (SELECT count(*) FROM fb_check.hearts)                                     AS hearts,
    (SELECT count(*) FROM fb_check.showcase)                                   AS showcased_books,
    (SELECT count(DISTINCT "UserId") FROM fb_check.showcase)                   AS readers_with_showcase,
    (SELECT count(*) FROM fb_check.showcase WHERE NOT public_read)             AS showcased_not_publicly_read,
    (SELECT count(*) FROM fb_check.authors)                                    AS favourite_authors,
    (SELECT count(DISTINCT "UserId") FROM fb_check.authors)                    AS readers_with_favourite_authors,
    (SELECT count(*) FROM fb_check.lists)                                      AS lists,
    (SELECT count(*) FROM fb_check.lists WHERE "Type" = 2)                     AS favourite_books_lists_already;
