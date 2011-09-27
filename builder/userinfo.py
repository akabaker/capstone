class UserInfo:

	def __init__(self):
		pass
		
	def user_from_session_key(session_key):
		session_engine = __import__(settings.SESSION_ENGINE, {}, {}, [''])
		session_wrapper = session_engine.SessionStore(session_key)
		user_id = session_wrapper.get(SESSION_KEY)
		auth_backend = load_backend(session_wrapper.get(BACKEND_SESSION_KEY))
	
		if user_id and auth_backend:
			return auth_backend.get_user(user_id)
		else:
			return AnonymousUser()
