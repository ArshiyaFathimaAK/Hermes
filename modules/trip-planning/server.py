"""Start Arshiya's local Hermes implementation. Run: python server.py"""
import argparse
from pathlib import Path
from hermes.api import make_server

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--db', default=str(Path(__file__).parent / 'hermes.db'))
    args = parser.parse_args()
    server = make_server(args.db, args.port)
    print(f'Hermes demo: http://127.0.0.1:{server.server_port}', flush=True)
    print('Synthetic catalog, fixed demo account, SQLite storage. Ctrl+C to stop.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
