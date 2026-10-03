update local_candidates set status='rejected', review_notes=review_notes||' · Not a business site' where status='needs_extraction' and website_url<>'https://www.hsbakery.com';
update local_jobs set state='cancelled' where candidate_id in (select id from local_candidates where status='rejected') and state<>'done';
update local_sources set status='blocked', notes='Not a business website (guide, government or directory)' where status='pending' and domain<>'hsbakery.com';
update local_sources set status='approved' where domain='hsbakery.com';
update local_jobs set state='queued', next_attempt_at=now() where state='paused';