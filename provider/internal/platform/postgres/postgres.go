package postgres


import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)



func Connect(ctx context .Context , databaseURL string) (*pgxpool.Pool, error) {
   config, err := pgxpool.ParseConfig(databaseURL)
   if err != nil {
	return nil , err 

   }
config.MaxConns = 10
	config.MinConns = 1
	config.MaxConnLifetime = time.Hour

	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(ctx); err != nil {
		db.Close()
		return nil, err
	}

	return db, nil


}