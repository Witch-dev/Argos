-- specs/five-books.md Phase 2: run on the same COPY after the FavouriteBooksList migration (before.sql first).
-- Every "problems" number must be 0. "info" rows are counts to read, not failures. Read-only.
WITH
expected_items AS (   -- the publicly read showcased books, positions closed up in showcase order
    SELECT "UserId", "BookId",
           (ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "ShowcasePosition") - 1)::int AS position
    FROM fb_check.showcase WHERE public_read),
fav_lists AS (SELECT * FROM "BookLists" WHERE "Type" = 2),
actual_items AS (
    SELECT l."UserId", i."BookId", i."Position" AS position, i."AddedAt", i."AddedByUserId", i."Note"
    FROM "ListItems" i JOIN fav_lists l ON l."Id" = i."BookListId"),
expected_authors AS (
    SELECT "UserId", "AuthorId",
           ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "CreatedAt", "AuthorId") AS rn
    FROM fb_check.authors)
SELECT 'problems' AS kind, 'showcased book missing from Favourite books, or at another position' AS check_name,
       count(*) AS n
FROM expected_items e
WHERE NOT EXISTS (SELECT 1 FROM actual_items a
                  WHERE a."UserId" = e."UserId" AND a."BookId" = e."BookId" AND a.position = e.position)
UNION ALL
SELECT 'problems', 'book in Favourite books that was not a publicly read showcased book', count(*)
FROM actual_items a
WHERE NOT EXISTS (SELECT 1 FROM expected_items e WHERE e."UserId" = a."UserId" AND e."BookId" = a."BookId")
UNION ALL
SELECT 'problems', 'reader got a Favourite books list without a showcase to fill it', count(*)
FROM fav_lists l
WHERE NOT EXISTS (SELECT 1 FROM expected_items e WHERE e."UserId" = l."UserId")
UNION ALL
SELECT 'problems', 'reader with a publicly read showcase but no Favourite books list', count(DISTINCT e."UserId")
FROM expected_items e
WHERE NOT EXISTS (SELECT 1 FROM fav_lists l WHERE l."UserId" = e."UserId")
UNION ALL
SELECT 'problems', 'Favourite books not Public / ranked / open / not books / wrong title / pinned / genre', count(*)
FROM fav_lists
WHERE "Visibility" <> 1 OR "IsRanked" OR "IsOpen" OR "Kind" <> 0 OR "Title" <> 'Favourite books'
   OR "ProfilePin" IS NOT NULL OR "GenreKey" IS NOT NULL OR "Description" IS NOT NULL
UNION ALL
SELECT 'problems', 'Favourite books item with a note, edition, wrong adder or date not the heart''s', count(*)
FROM actual_items a
JOIN fb_check.hearts h ON h."UserId" = a."UserId" AND h."BookId" = a."BookId"
WHERE a."Note" IS NOT NULL OR a."AddedByUserId" <> a."UserId" OR a."AddedAt" <> h."CreatedAt"
UNION ALL
SELECT 'problems', 'Favourite books with more than 5 books', count(*)
FROM (SELECT "UserId" FROM actual_items GROUP BY "UserId" HAVING count(*) > 5) x
UNION ALL
SELECT 'problems', 'hearts lost or added', (
    (SELECT count(*) FROM fb_check.hearts h
     WHERE NOT EXISTS (SELECT 1 FROM "FavouriteBooks" f WHERE f."UserId" = h."UserId" AND f."BookId" = h."BookId"))
  + (SELECT count(*) FROM "FavouriteBooks" f
     WHERE NOT EXISTS (SELECT 1 FROM fb_check.hearts h WHERE h."UserId" = f."UserId" AND h."BookId" = f."BookId")))
UNION ALL
SELECT 'problems', 'other lists or list items lost', (
    (SELECT count(*) FROM fb_check.lists b WHERE NOT EXISTS (SELECT 1 FROM "BookLists" l WHERE l."Id" = b."Id"))
  + (SELECT count(*) FROM fb_check.items b WHERE NOT EXISTS (SELECT 1 FROM "ListItems" i WHERE i."Id" = b."Id")))
UNION ALL
SELECT 'problems', 'favourite author lost or added', (
    (SELECT count(*) FROM fb_check.authors b
     WHERE NOT EXISTS (SELECT 1 FROM "FavouriteAuthors" f WHERE f."UserId" = b."UserId" AND f."AuthorId" = b."AuthorId"))
  + (SELECT count(*) FROM "FavouriteAuthors" f
     WHERE NOT EXISTS (SELECT 1 FROM fb_check.authors b WHERE b."UserId" = f."UserId" AND b."AuthorId" = f."AuthorId")))
UNION ALL
SELECT 'problems', 'favourite author not in its slot (first 5 by date in 0-4, the rest none)', count(*)
FROM expected_authors e
JOIN "FavouriteAuthors" f ON f."UserId" = e."UserId" AND f."AuthorId" = e."AuthorId"
WHERE f."ShowcasePosition" IS DISTINCT FROM (CASE WHEN e.rn <= 5 THEN (e.rn - 1)::smallint END)
UNION ALL
SELECT 'info', 'Favourite books lists made', (SELECT count(*) FROM fav_lists)
UNION ALL
SELECT 'info', 'books moved into them', (SELECT count(*) FROM actual_items)
UNION ALL
SELECT 'info', 'showcased books left out (no Read log everyone may see; still hearted)',
       (SELECT count(*) FROM fb_check.showcase WHERE NOT public_read)
UNION ALL
SELECT 'info', 'readers whose whole showcase was left out',
       (SELECT count(*) FROM (SELECT "UserId" FROM fb_check.showcase GROUP BY "UserId" HAVING NOT bool_or(public_read)) x)
ORDER BY 1 DESC, 2;
