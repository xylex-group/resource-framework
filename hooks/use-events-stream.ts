export function useEventsStream(_onMessage?: (msg: unknown) => void) {
	return null;
	// const { user } = useUserStore();
	// const [socket, setSocket] = useState<WebSocket | null>(null);
	// const reconnectAttempts = useRef(0);
	// const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
	// const totalFailedAttempts = useRef(0);
	// useEffect(() => {
	// 	if (!user?.company_id) {
	// 		return;
	// 	}
	// 	const connectWebSocket = () => {
	// 		if (!user?.company_id) {
	// 			console.error("No company ID found. Cannot connect to WebSocket.");
	// 			return;
	// 		}

	// 		if (totalFailedAttempts.current >= 10) {
	// 			console.error("websocket connection failed 10 times, stopping reconnection attempts");
	// 			return;
	// 		}

	// 		const cleanUrlWss = (base || "")
	// 			.replace(/^https?:\/\//, "")
	// 			.replace(/\/$/, "");

	// 		const ws = new WebSocket(`wss://${cleanUrlWss}${endpoint}`);
	// 		setSocket(ws);

	// 		ws.onopen = () => {
	// 			reconnectAttempts.current = 0;
	// 			totalFailedAttempts.current = 0;
	// 			ws.send(JSON.stringify({ subscribe_to_company_id: user.company_id }));
	// 		};
	// 		ws.onmessage = (event) => {
	// 			try {
	// 				const parsedMessage = JSON.parse(event.data);
	// 				onMessage?.(parsedMessage);
	// 			} catch (error) {
	// 				console.error("Error parsing message:", event.data);
	// 			}
	// 		};
	// 		ws.onerror = (err) => {
	// 			console.error("WebSocket error:", err);
	// 			totalFailedAttempts.current += 1;
	// 		};
	// 		ws.onclose = () => {
	// 			totalFailedAttempts.current += 1;
	// 			if (totalFailedAttempts.current >= 10) {
	// 				console.error("websocket connection failed 10 times, stopping reconnection attempts");
	// 				return;
	// 			}

	// 			if (reconnectAttempts.current < 3) {
	// 				reconnectAttempts.current += 1;
	// 				connectWebSocket();
	// 			} else {
	// 				reconnectTimeout.current = setTimeout(() => {
	// 					reconnectAttempts.current = 0;
	// 					connectWebSocket();
	// 				}, 60000);
	// 			}
	// 		};

	// 		return () => {
	// 			ws.close();
	// 			if (reconnectTimeout.current) {
	// 				clearTimeout(reconnectTimeout.current);
	// 			}
	// 		};
	// 	};

	// 	const cleanup = connectWebSocket();

	// 	return cleanup;
	// }, [user?.company_id, onMessage]);

	// return socket;
}
