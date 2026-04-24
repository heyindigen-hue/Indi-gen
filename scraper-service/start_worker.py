"""Run: python start_worker.py"""
from rq import Worker
from app.queue import q, redis_conn

if __name__ == "__main__":
    w = Worker([q], connection=redis_conn)
    print("[rq-worker] starting, listening on 'linkedin' queue")
    w.work()
