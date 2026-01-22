import sqlite3
import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class Database:
    def __init__(self):
        self.conn = sqlite3.connect('academic_studio.db', check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.create_tables()

    def create_tables(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE,
                password TEXT
            )
        ''')
        
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS quiz_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT,
                score INTEGER,
                correct_count INTEGER,
                total_questions INTEGER,
                topic_summary TEXT,
                advice TEXT,
                date TEXT
            )
        ''')
        self.conn.commit()

        # Test kullanıcısı (Hashlenmiş şifre ile)
        try:
            hashed_pw = generate_password_hash('123456')
            self.cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", ('test@student.com', hashed_pw))
            self.conn.commit()
        except sqlite3.IntegrityError:
            pass

    def check_user(self, email, password):
        # 1. Kullanıcıyı bul
        self.cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = self.cursor.fetchone()
        
        if user:
            # 2. Şifreyi kontrol et (Hash kıyaslaması)
            # user[2] veritabanındaki hashlenmiş şifredir
            if check_password_hash(user[2], password):
                return user
        return None

    def register_user(self, email, password):
        try:
            self.cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            if self.cursor.fetchone():
                return False, "Bu e-posta zaten kayıtlı!"
            
            # 3. Şifreyi Hashle ve Öyle Kaydet
            hashed_pw = generate_password_hash(password)
            self.cursor.execute("INSERT INTO users (email, password) VALUES (?, ?)", (email, hashed_pw))
            self.conn.commit()
            return True, "Kayıt başarılı!"
        except Exception as e:
            return False, str(e)

    def change_password(self, email, old_password, new_password):
        # 1. Eski şifreyi kontrol et (Hash ile)
        user = self.check_user(email, old_password)
        if not user:
            return False, "Mevcut şifreniz hatalı."
        
        # 2. Yeni şifreyi hashle ve güncelle
        try:
            new_hashed_pw = generate_password_hash(new_password)
            self.cursor.execute("UPDATE users SET password = ? WHERE email = ?", (new_hashed_pw, email))
            self.conn.commit()
            return True, "Şifreniz başarıyla güncellendi."
        except Exception as e:
            return False, f"Hata: {str(e)}"

    # --- Diğer Fonksiyonlar (Aynı Kalıyor) ---
    def get_user_stats(self, email):
        self.cursor.execute("SELECT score, correct_count, total_questions FROM quiz_history WHERE user_email = ?", (email,))
        rows = self.cursor.fetchall()
        
        total_quizzes = len(rows)
        if total_quizzes == 0:
            return None
            
        total_score = sum([r[0] for r in rows])
        total_correct = sum([r[1] for r in rows]) if rows[0][1] is not None else 0
        total_questions_all = sum([r[2] for r in rows]) if rows[0][2] is not None else 0
        total_wrong = total_questions_all - total_correct
        
        return {
            "total_quizzes": total_quizzes,
            "average_score": round(total_score / total_quizzes),
            "total_correct": total_correct,
            "total_wrong": total_wrong
        }

    def save_quiz_result(self, email, score, correct, total, topic, advice):
        date_now = datetime.datetime.now().strftime("%d.%m.%Y %H:%M")
        try:
            self.cursor.execute("""
                INSERT INTO quiz_history (user_email, score, correct_count, total_questions, topic_summary, advice, date) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (email, score, correct, total, topic, advice, date_now))
            self.conn.commit()
            return True
        except Exception as e:
            print("DB Hatası:", e)
            return False

    def get_user_history(self, email):
        self.cursor.execute("SELECT * FROM quiz_history WHERE user_email = ? ORDER BY id DESC", (email,))
        columns = [column[0] for column in self.cursor.description]
        results = []
        for row in self.cursor.fetchall():
            results.append(dict(zip(columns, row)))
        return results