import { useEffect, useState } from 'react';

export const useUtterances = (commentNodeId) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!visible) return;
		// docs - https://utteranc.es/
		const script = document.createElement('script');
		script.src = 'https://utteranc.es/client.js';
		script.async = true;
		script.setAttribute('repo', 'SilvioDiasJr/blog-ignite');
		script.setAttribute('issue-term', 'pathname');
		script.setAttribute('label', 'comment :speech_balloon:');
		script.setAttribute('theme', 'photon-dark');
		script.setAttribute('crossorigin', 'anonymous');

		const scriptParentNode = document.getElementById(commentNodeId);
		scriptParentNode.appendChild(script);

		return () => {
			// cleanup - remove the older script with previous theme
			scriptParentNode.removeChild(scriptParentNode.firstChild);
		};
	}, [visible]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setVisible(true);
					}
				});
			},
			{
				threshold: 1,
			}
		);
		observer.observe(document.getElementById(commentNodeId));
	}, [commentNodeId]);
};