const pool = require('../config/db');

class Game {
    /**
     * Finds a game in our local DB by its RAWG ID.
     * If not found, it creates a new entry.
     * Returns the local game ID.
     */
    static async findOrCreate(gameData) {
        const { id, name, released, background_image, rating } = gameData;

        let [rows] = await pool.query('SELECT id FROM games WHERE rawg_id = ?', [id]);
        if (rows.length > 0) {
            return rows[0].id; // Return existing game's local ID
        }

        const [result] = await pool.query(
            'INSERT INTO games (rawg_id, name, released, background_image, rating) VALUES (?, ?, ?, ?, ?)',
            [id, name, released, background_image, rating]
        );
        return result.insertId; // Return new game's local ID
    }

    /**
     * Creates or updates a review for a game by a user.
     */
    static async saveReview(userId, localGameId, rating, reviewText) {
        const [result] = await pool.query(
            `INSERT INTO reviews (user_id, game_id, rating, review_text)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)`,
            [userId, localGameId, rating, reviewText]
        );
        return result;
    }

    /**
     * [ENHANCEMENT 2] Gets all reviews from a user's library, joining with game details
     * and calculating community average rating.
     */
    static async getUserLibrary(userId) {
        const [rows] = await pool.query(
            `SELECT 
                r.id as review_id, 
                r.rating, 
                r.review_text, 
                r.created_at,
                g.id as game_id,
                g.name,
                g.background_image,
                g.released,
                (SELECT AVG(rating) FROM reviews WHERE game_id = g.id) AS community_rating
             FROM reviews r
             JOIN games g ON r.game_id = g.id
             WHERE r.user_id = ?
             ORDER BY r.created_at DESC`,
            [userId]
        );
        return rows;
    }

    /**
     * [ENHANCEMENT 2] Searches within a user's library by game title,
     * including community average rating.
     */
    static async searchUserLibrary(userId, query) {
        const searchTerm = `%${query}%`;
        const [rows] = await pool.query(
            `SELECT
                r.id as review_id, r.rating, r.review_text, r.created_at,
                g.id as game_id, g.name, g.background_image, g.released,
                (SELECT AVG(rating) FROM reviews WHERE game_id = g.id) AS community_rating
             FROM reviews r
             JOIN games g ON r.game_id = g.id
             WHERE r.user_id = ? AND g.name LIKE ?
             ORDER BY r.created_at DESC`,
            [userId, searchTerm]
        );
        return rows;
    }

    /**
     * [ENHANCEMENT 2] Fetches details for a single game, including its community rating.
     */
    static async getGameDetails(localGameId) {
        const [rows] = await pool.query(
            `SELECT 
                g.*,
                (SELECT AVG(rating) FROM reviews WHERE game_id = g.id) AS community_rating
             FROM games g
             WHERE g.id = ?`,
            [localGameId]
        );
        return rows[0];
    }
    
    /**
     * [FIX] Fetches a single review for editing. This function was previously missing.
     */
    static async getReview(userId, localGameId) {
        const [rows] = await pool.query(
            `SELECT r.rating, r.review_text FROM reviews r WHERE r.user_id = ? AND r.game_id = ?`,
            [userId, localGameId]
        );
        return rows[0];
    }

    /**
     * Removes a review from a user's library.
     */
    static async removeReview(reviewId, userId) {
        // Ensure user owns the review before deleting
        const [result] = await pool.query(
            'DELETE FROM reviews WHERE id = ? AND user_id = ?',
            [reviewId, userId]
        );
        return result.affectedRows;
    }
}

module.exports = Game;