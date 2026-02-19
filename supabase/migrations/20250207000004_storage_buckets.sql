insert into storage.buckets (id, name, public)
values ('package-images', 'package-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', true)
on conflict (id) do nothing;

drop policy if exists "package_images_read" on storage.objects;
create policy "package_images_read"
on storage.objects for select
using (bucket_id = 'package-images');

drop policy if exists "package_images_insert" on storage.objects;
create policy "package_images_insert"
on storage.objects for insert
with check (bucket_id = 'package-images' and auth.role() = 'authenticated');

drop policy if exists "package_images_update" on storage.objects;
create policy "package_images_update"
on storage.objects for update
using (bucket_id = 'package-images' and auth.uid() = owner)
with check (bucket_id = 'package-images' and auth.uid() = owner);

drop policy if exists "package_images_delete" on storage.objects;
create policy "package_images_delete"
on storage.objects for delete
using (bucket_id = 'package-images' and auth.uid() = owner);

drop policy if exists "verification_docs_read" on storage.objects;
create policy "verification_docs_read"
on storage.objects for select
using (bucket_id = 'verification-docs');

drop policy if exists "verification_docs_insert" on storage.objects;
create policy "verification_docs_insert"
on storage.objects for insert
with check (bucket_id = 'verification-docs' and auth.role() = 'authenticated');

drop policy if exists "verification_docs_update" on storage.objects;
create policy "verification_docs_update"
on storage.objects for update
using (bucket_id = 'verification-docs' and auth.uid() = owner)
with check (bucket_id = 'verification-docs' and auth.uid() = owner);

drop policy if exists "verification_docs_delete" on storage.objects;
create policy "verification_docs_delete"
on storage.objects for delete
using (bucket_id = 'verification-docs' and auth.uid() = owner);
