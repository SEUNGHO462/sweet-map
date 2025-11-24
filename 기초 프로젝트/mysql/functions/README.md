Edge Functions (optional)

Use this folder to plan small serverless functions when needed:
- fetchPhotos: proxy Google CSE/Images (hide API keys, add TTL cache)
- placeEnrich: normalize/merge Kakao+Google place data, cache by coords
- weeklyTopPicks: batch job to publish curated list
- eventLog: lightweight analytics endpoint

You can add these later with your chosen platform (e.g., serverless functions or backend cron). For now, this is a placeholder.

