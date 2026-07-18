


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "public"."order_fulfillment_status" AS ENUM (
    'awaiting_payment',
    'payment_submitted',
    'accepted',
    'preparing',
    'shipped',
    'delivered',
    'cancelled'
);


ALTER TYPE "public"."order_fulfillment_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'paid',
    'failed',
    'cancelled'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."document_has_registered_account"("p_normalized" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.customers c
    where public.normalize_document_id(c.document_id) = p_normalized
      and p_normalized is not null
      and length(p_normalized) >= 6
      and c.auth_user_id is not null
  );
$$;


ALTER FUNCTION "public"."document_has_registered_account"("p_normalized" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."document_has_registered_account"("p_normalized" "text") IS 'True si algún cliente ya tiene esta cédula (normalizada) vinculada a una cuenta Auth.';



CREATE OR REPLACE FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select c.id
  from public.customers c
  where public.normalize_document_id(c.document_id) is not null
    and public.normalize_document_id(c.document_id) = p_normalized
    and p_normalized is not null
    and length(p_normalized) >= 6
  order by c.created_at asc
  limit 1;
$$;


ALTER FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") IS 'Cliente más antiguo con el mismo documento normalizado; vincular auth tienda.';



CREATE OR REPLACE FUNCTION "public"."normalize_document_id"("p" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
  select nullif(regexp_replace(coalesce(trim(p), ''), '\D', '', 'g'), '');
$$;


ALTER FUNCTION "public"."normalize_document_id"("p" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."normalize_document_id"("p" "text") IS 'Documento solo con dígitos; vacío si no queda nada (cédula/NIT sin puntos ni guiones).';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."storefront_coupon_discount_for_product"("p_product_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(max(c.discount_percent), 0)::integer
  from store_coupon_products l
  inner join store_coupons c on c.id = l.coupon_id
  where l.product_id = p_product_id
    and c.is_enabled
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
    and c.discount_percent > 0;
$$;


ALTER FUNCTION "public"."storefront_coupon_discount_for_product"("p_product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."storefront_coupon_discounts"() RETURNS TABLE("product_id" "uuid", "discount_percent" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select
    l.product_id,
    max(c.discount_percent)::integer as discount_percent
  from store_coupon_products l
  inner join store_coupons c on c.id = l.coupon_id
  where c.is_enabled
    and (c.starts_at is null or c.starts_at <= now())
    and (c.ends_at is null or c.ends_at >= now())
    and c.discount_percent > 0
  group by l.product_id;
$$;


ALTER FUNCTION "public"."storefront_coupon_discounts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_admin_profile"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."user_has_admin_profile"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_has_admin_profile"() IS 'Comprueba si existe fila en profiles para auth.uid(); sin recursión RLS.';



CREATE OR REPLACE FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


ALTER FUNCTION "storage"."allow_any_operation"("expected_operations" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."allow_only_operation"("expected_operation" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


ALTER FUNCTION "storage"."allow_only_operation"("expected_operation" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


ALTER FUNCTION "storage"."get_common_prefix"("p_key" "text", "p_prefix" "text", "p_delimiter" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("_bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text", "sort_order" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."protect_delete"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."protect_delete"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_by_timestamp"("p_prefix" "text", "p_bucket_id" "text", "p_limit" integer, "p_level" integer, "p_start_after" "text", "p_sort_order" "text", "p_sort_column" "text", "p_sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" json,
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."custom_oauth_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_type" "text" NOT NULL,
    "identifier" "text" NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "client_secret" "text" NOT NULL,
    "acceptable_client_ids" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "scopes" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "pkce_enabled" boolean DEFAULT true NOT NULL,
    "attribute_mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "authorization_params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "email_optional" boolean DEFAULT false NOT NULL,
    "issuer" "text",
    "discovery_url" "text",
    "skip_nonce_check" boolean DEFAULT false NOT NULL,
    "cached_discovery" "jsonb",
    "discovery_cached_at" timestamp with time zone,
    "authorization_url" "text",
    "token_url" "text",
    "userinfo_url" "text",
    "jwks_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "custom_oauth_providers_authorization_url_https" CHECK ((("authorization_url" IS NULL) OR ("authorization_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_authorization_url_length" CHECK ((("authorization_url" IS NULL) OR ("char_length"("authorization_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_client_id_length" CHECK ((("char_length"("client_id") >= 1) AND ("char_length"("client_id") <= 512))),
    CONSTRAINT "custom_oauth_providers_discovery_url_length" CHECK ((("discovery_url" IS NULL) OR ("char_length"("discovery_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_identifier_format" CHECK (("identifier" ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::"text")),
    CONSTRAINT "custom_oauth_providers_issuer_length" CHECK ((("issuer" IS NULL) OR (("char_length"("issuer") >= 1) AND ("char_length"("issuer") <= 2048)))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_https" CHECK ((("jwks_uri" IS NULL) OR ("jwks_uri" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_jwks_uri_length" CHECK ((("jwks_uri" IS NULL) OR ("char_length"("jwks_uri") <= 2048))),
    CONSTRAINT "custom_oauth_providers_name_length" CHECK ((("char_length"("name") >= 1) AND ("char_length"("name") <= 100))),
    CONSTRAINT "custom_oauth_providers_oauth2_requires_endpoints" CHECK ((("provider_type" <> 'oauth2'::"text") OR (("authorization_url" IS NOT NULL) AND ("token_url" IS NOT NULL) AND ("userinfo_url" IS NOT NULL)))),
    CONSTRAINT "custom_oauth_providers_oidc_discovery_url_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("discovery_url" IS NULL) OR ("discovery_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_issuer_https" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NULL) OR ("issuer" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_oidc_requires_issuer" CHECK ((("provider_type" <> 'oidc'::"text") OR ("issuer" IS NOT NULL))),
    CONSTRAINT "custom_oauth_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['oauth2'::"text", 'oidc'::"text"]))),
    CONSTRAINT "custom_oauth_providers_token_url_https" CHECK ((("token_url" IS NULL) OR ("token_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_token_url_length" CHECK ((("token_url" IS NULL) OR ("char_length"("token_url") <= 2048))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_https" CHECK ((("userinfo_url" IS NULL) OR ("userinfo_url" ~~ 'https://%'::"text"))),
    CONSTRAINT "custom_oauth_providers_userinfo_url_length" CHECK ((("userinfo_url" IS NULL) OR ("char_length"("userinfo_url") <= 2048)))
);


ALTER TABLE "auth"."custom_oauth_providers" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "code_challenge" "text",
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone,
    "invite_token" "text",
    "referrer" "text",
    "oauth_client_state_id" "uuid",
    "linking_target_id" "uuid",
    "email_optional" boolean DEFAULT false NOT NULL
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'Stores metadata for all OAuth/SSO login flows';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid",
    "last_webauthn_challenge_data" "jsonb"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';



CREATE TABLE IF NOT EXISTS "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    "nonce" "text",
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_nonce_length" CHECK (("char_length"("nonce") <= 255)),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_client_states" (
    "id" "uuid" NOT NULL,
    "provider_type" "text" NOT NULL,
    "code_verifier" "text",
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "auth"."oauth_client_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."oauth_client_states" IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';



CREATE TABLE IF NOT EXISTS "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    "token_endpoint_auth_method" "text" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048)),
    CONSTRAINT "oauth_clients_token_endpoint_auth_method_check" CHECK (("token_endpoint_auth_method" = ANY (ARRAY['client_secret_basic'::"text", 'client_secret_post'::"text", 'none'::"text"])))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid",
    "refresh_token_hmac_key" "text",
    "refresh_token_counter" bigint,
    "scopes" "text",
    CONSTRAINT "sessions_scopes_length" CHECK (("char_length"("scopes") <= 4096))
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "auth"."webauthn_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "challenge_type" "text" NOT NULL,
    "session_data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    CONSTRAINT "webauthn_challenges_challenge_type_check" CHECK (("challenge_type" = ANY (ARRAY['signup'::"text", 'registration'::"text", 'authentication'::"text"])))
);


ALTER TABLE "auth"."webauthn_challenges" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."webauthn_credentials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "credential_id" "bytea" NOT NULL,
    "public_key" "bytea" NOT NULL,
    "attestation_type" "text" DEFAULT ''::"text" NOT NULL,
    "aaguid" "uuid",
    "sign_count" bigint DEFAULT 0 NOT NULL,
    "transports" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "backup_eligible" boolean DEFAULT false NOT NULL,
    "backed_up" boolean DEFAULT false NOT NULL,
    "friendly_name" "text" DEFAULT ''::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_used_at" timestamp with time zone
);


ALTER TABLE "auth"."webauthn_credentials" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "summary" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "admin_activity_log_action_type_check" CHECK (("action_type" = ANY (ARRAY['customer_created'::"text", 'customer_updated'::"text", 'product_created'::"text", 'product_updated'::"text", 'stock_adjusted'::"text", 'stock_transferred'::"text", 'sale_created'::"text", 'sale_cancelled'::"text"])))
);


ALTER TABLE "public"."admin_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "icon_key" "text" DEFAULT 'tag'::"text" NOT NULL,
    "listing_hero_image_path" "text",
    "listing_hero_alt_text" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."categories"."listing_hero_image_path" IS 'Ej.: bolsos.jpg → /public/bolsos.jpg; o store-banners/uuid.jpg; o https://...';



COMMENT ON COLUMN "public"."categories"."listing_hero_alt_text" IS 'Texto alternativo de la imagen para accesibilidad.';



CREATE TABLE IF NOT EXISTS "public"."customer_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "label" "text" DEFAULT 'Casa'::"text" NOT NULL,
    "address_line" "text" DEFAULT ''::"text" NOT NULL,
    "reference" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "document_id" "text",
    "shipping_address" "text",
    "shipping_city" "text",
    "shipping_postal_code" "text",
    "notes" "text",
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auth_user_id" "uuid",
    "birth_date" "date",
    CONSTRAINT "customers_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'storefront'::"text"])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."customers"."birth_date" IS 'Opcional. Usado para saludos / campañas; el cliente la gestiona desde su cuenta.';



CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "product_name_snapshot" "text" NOT NULL,
    "variant_id" "uuid",
    "variant_label_snapshot" "text",
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "order_items_unit_price_cents_check" CHECK (("unit_price_cents" >= 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_payment_proofs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "mime_type" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."order_payment_proofs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status" NOT NULL,
    "customer_email" "text" NOT NULL,
    "customer_name" "text" NOT NULL,
    "total_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'COP'::"text" NOT NULL,
    "wompi_payment_link_id" "text",
    "wompi_transaction_id" "text",
    "wompi_reference" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "shipping_phone" "text",
    "shipping_address" "text",
    "shipping_city" "text",
    "shipping_postal_code" "text",
    "customer_id" "uuid",
    "cancellation_reason" "text",
    "subtotal_cents" integer,
    "shipping_cents" integer DEFAULT 0 NOT NULL,
    "shipping_department_code" "text",
    "shipping_municipality_code" "text",
    "shipping_method" "text" DEFAULT 'delivery'::"text" NOT NULL,
    "fulfillment_status" "public"."order_fulfillment_status",
    "tracking_token" "text",
    "payment_method" "text",
    CONSTRAINT "orders_shipping_method_check" CHECK (("shipping_method" = ANY (ARRAY['delivery'::"text", 'pickup'::"text"]))),
    CONSTRAINT "orders_total_cents_check" CHECK (("total_cents" >= 0))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."cancellation_reason" IS 'Texto libre con el motivo de anulación; se limpia si el pedido deja de estar cancelado.';



COMMENT ON COLUMN "public"."orders"."fulfillment_status" IS 'Estado logístico del pedido (independiente del cobro)';



COMMENT ON COLUMN "public"."orders"."tracking_token" IS 'Token secreto para /pedidos/seguimiento/[token]';



COMMENT ON COLUMN "public"."orders"."payment_method" IS 'wompi | bank_transfer';



CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "price_cents" integer NOT NULL,
    "stock_warehouse" integer DEFAULT 0 NOT NULL,
    "stock_local" integer DEFAULT 0 NOT NULL,
    "image_paths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cost_cents" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "product_variants_cost_cents_check" CHECK (("cost_cents" >= 0)),
    CONSTRAINT "product_variants_price_cents_check" CHECK (("price_cents" >= 0)),
    CONSTRAINT "product_variants_stock_local_check" CHECK (("stock_local" >= 0)),
    CONSTRAINT "product_variants_stock_warehouse_check" CHECK (("stock_warehouse" >= 0))
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_variants" IS 'Presentaciones vendibles de un producto (fragancia, tamaño, tono, color) con precio y stock propios.';



COMMENT ON COLUMN "public"."product_variants"."cost_cents" IS 'Costo de compra de esta presentación (SKU).';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "price_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'COP'::"text" NOT NULL,
    "image_path" "text",
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" "uuid",
    "stock_warehouse" integer DEFAULT 0 NOT NULL,
    "stock_local" integer DEFAULT 0 NOT NULL,
    "stock_quantity" integer GENERATED ALWAYS AS (("stock_warehouse" + "stock_local")) STORED,
    "reference" "text" DEFAULT ''::"text" NOT NULL,
    "brand" "text" DEFAULT ''::"text" NOT NULL,
    "cost_cents" integer DEFAULT 0 NOT NULL,
    "size_value" numeric(10,2),
    "size_unit" "text",
    "has_expiration" boolean DEFAULT false NOT NULL,
    "expiration_date" "date",
    "colors" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "has_vat" boolean DEFAULT false NOT NULL,
    "vat_percent" numeric(5,2),
    "size_options" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "fragrance_options" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "fragrance_option_images" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "image_paths" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "variant_axis" "text" DEFAULT 'none'::"text" NOT NULL,
    CONSTRAINT "products_cost_cents_check" CHECK (("cost_cents" >= 0)),
    CONSTRAINT "products_expiration_consistency" CHECK (("has_expiration" OR ("expiration_date" IS NULL))),
    CONSTRAINT "products_price_cents_check" CHECK (("price_cents" >= 0)),
    CONSTRAINT "products_size_unit_check" CHECK ((("size_unit" IS NULL) OR ("size_unit" = ANY (ARRAY['ml'::"text", 'l'::"text", 'g'::"text", 'kg'::"text", 'oz'::"text", 'unidad'::"text"])))),
    CONSTRAINT "products_size_value_nonneg" CHECK ((("size_value" IS NULL) OR ("size_value" > (0)::numeric))),
    CONSTRAINT "products_stock_local_check" CHECK (("stock_local" >= 0)),
    CONSTRAINT "products_stock_warehouse_check" CHECK (("stock_warehouse" >= 0)),
    CONSTRAINT "products_variant_axis_check" CHECK (("variant_axis" = ANY (ARRAY['none'::"text", 'fragrance'::"text", 'size'::"text", 'tone'::"text", 'color'::"text"]))),
    CONSTRAINT "products_vat_consistency" CHECK (("has_vat" OR ("vat_percent" IS NULL))),
    CONSTRAINT "products_vat_percent_range" CHECK ((("vat_percent" IS NULL) OR (("vat_percent" >= (0)::numeric) AND ("vat_percent" <= (100)::numeric))))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON COLUMN "public"."products"."size_options" IS 'JSON array: [{"value":177,"unit":"ml"},…]. Vacío → usar solo size_value/size_unit. La primera entrada se sincroniza en esas columnas al guardar.';



COMMENT ON COLUMN "public"."products"."variant_axis" IS 'Eje único de variantes: none | fragrance | size | tone | color. Si no es none, el cliente elige una fila de product_variants.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_name" "text",
    "login_username" "text",
    "public_email" "text",
    "job_role" "text" DEFAULT 'owner'::"text" NOT NULL,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "branch_label" "text",
    "avatar_variant" "text" DEFAULT 'A'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_job_role_check" CHECK (("job_role" = ANY (ARRAY['owner'::"text", 'cashier'::"text", 'support'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = 'admin'::"text"))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_departments" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shipping_departments_code_check" CHECK (("code" ~ '^\d{2}$'::"text"))
);


ALTER TABLE "public"."shipping_departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_municipalities" (
    "code" "text" NOT NULL,
    "department_code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "cost_cents" integer DEFAULT 0 NOT NULL,
    "is_delivery_enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "shipping_municipalities_code_check" CHECK (("code" ~ '^\d{5}$'::"text")),
    CONSTRAINT "shipping_municipalities_cost_cents_check" CHECK (("cost_cents" >= 0))
);


ALTER TABLE "public"."shipping_municipalities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_banners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "placement" "text" NOT NULL,
    "image_path" "text" NOT NULL,
    "href" "text",
    "alt_text" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_published" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_banners_placement_check" CHECK (("placement" = ANY (ARRAY['hero'::"text", 'products'::"text"])))
);


ALTER TABLE "public"."store_banners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_coupon_products" (
    "coupon_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."store_coupon_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_label" "text",
    "banner_message" "text" NOT NULL,
    "code" "text" NOT NULL,
    "discount_percent" integer DEFAULT 10 NOT NULL,
    "is_enabled" boolean DEFAULT false NOT NULL,
    "show_in_banner" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_coupons_discount_percent_check" CHECK ((("discount_percent" >= 0) AND ("discount_percent" <= 100)))
);


ALTER TABLE "public"."store_coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "concept" "text" NOT NULL,
    "category" "text" DEFAULT 'operativo'::"text" NOT NULL,
    "amount_cents" integer NOT NULL,
    "payment_method" "text" DEFAULT 'transferencia'::"text" NOT NULL,
    "notes" "text",
    "expense_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "store_expenses_amount_cents_check" CHECK (("amount_cents" >= 0))
);


ALTER TABLE "public"."store_expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_welcome_modals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text" NOT NULL,
    "discount_code" "text",
    "cta_label" "text" DEFAULT 'Escribir por WhatsApp'::"text" NOT NULL,
    "cta_href" "text",
    "is_enabled" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_path" "text"
);


ALTER TABLE "public"."store_welcome_modals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_invoice_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "storage_path" "text" NOT NULL,
    "file_name" "text" DEFAULT ''::"text" NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."supplier_invoice_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_invoice_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "product_name_snapshot" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "unit_price_cents" integer NOT NULL,
    "vat_rate_bps" integer DEFAULT 0 NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "supplier_invoice_lines_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "supplier_invoice_lines_unit_price_cents_check" CHECK (("unit_price_cents" >= 0)),
    CONSTRAINT "supplier_invoice_lines_vat_rate_bps_check" CHECK ((("vat_rate_bps" >= 0) AND ("vat_rate_bps" <= 10000)))
);


ALTER TABLE "public"."supplier_invoice_lines" OWNER TO "postgres";


COMMENT ON COLUMN "public"."supplier_invoice_lines"."vat_rate_bps" IS 'Tasa IVA en basis points (1900 = 19%). 0: sin IVA / legacy. >0: unitario neto, IVA = redondeo(cant×unitario×tasa/10000).';



CREATE TABLE IF NOT EXISTS "public"."supplier_invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount_cents" integer NOT NULL,
    "payment_method" "text" DEFAULT 'transferencia'::"text" NOT NULL,
    "notes" "text",
    "paid_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "supplier_invoice_payments_amount_cents_check" CHECK (("amount_cents" > 0))
);


ALTER TABLE "public"."supplier_invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."supplier_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "folio" "text" NOT NULL,
    "total_cents" integer NOT NULL,
    "issue_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text",
    "is_cancelled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "supplier_invoices_total_cents_check" CHECK (("total_cents" >= 0))
);


ALTER TABLE "public"."supplier_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "document_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."iceberg_namespaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_namespaces" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."iceberg_tables" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "namespace_id" "uuid" NOT NULL,
    "bucket_name" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "location" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "remote_table_id" "text",
    "shard_key" "text",
    "shard_id" "text",
    "catalog_id" "uuid" NOT NULL
);


ALTER TABLE "storage"."iceberg_tables" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb",
    "metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_identifier_key" UNIQUE ("identifier");



ALTER TABLE ONLY "auth"."custom_oauth_providers"
    ADD CONSTRAINT "custom_oauth_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_client_states"
    ADD CONSTRAINT "oauth_client_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_payment_proofs"
    ADD CONSTRAINT "order_payment_proofs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_label_key" UNIQUE ("product_id", "label");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_departments"
    ADD CONSTRAINT "shipping_departments_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."shipping_municipalities"
    ADD CONSTRAINT "shipping_municipalities_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."store_banners"
    ADD CONSTRAINT "store_banners_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_coupon_products"
    ADD CONSTRAINT "store_coupon_products_pkey" PRIMARY KEY ("coupon_id", "product_id");



ALTER TABLE ONLY "public"."store_coupons"
    ADD CONSTRAINT "store_coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_expenses"
    ADD CONSTRAINT "store_expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_welcome_modals"
    ADD CONSTRAINT "store_welcome_modals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_invoice_attachments"
    ADD CONSTRAINT "supplier_invoice_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_invoice_lines"
    ADD CONSTRAINT "supplier_invoice_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_invoice_payments"
    ADD CONSTRAINT "supplier_invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_invoices"
    ADD CONSTRAINT "supplier_invoices_folio_key" UNIQUE ("folio");



ALTER TABLE ONLY "public"."supplier_invoices"
    ADD CONSTRAINT "supplier_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "custom_oauth_providers_created_at_idx" ON "auth"."custom_oauth_providers" USING "btree" ("created_at");



CREATE INDEX "custom_oauth_providers_enabled_idx" ON "auth"."custom_oauth_providers" USING "btree" ("enabled");



CREATE INDEX "custom_oauth_providers_identifier_idx" ON "auth"."custom_oauth_providers" USING "btree" ("identifier");



CREATE INDEX "custom_oauth_providers_provider_type_idx" ON "auth"."custom_oauth_providers" USING "btree" ("provider_type");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_oauth_client_states_created_at" ON "auth"."oauth_client_states" USING "btree" ("created_at");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");



CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");



CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "webauthn_challenges_expires_at_idx" ON "auth"."webauthn_challenges" USING "btree" ("expires_at");



CREATE INDEX "webauthn_challenges_user_id_idx" ON "auth"."webauthn_challenges" USING "btree" ("user_id");



CREATE UNIQUE INDEX "webauthn_credentials_credential_id_key" ON "auth"."webauthn_credentials" USING "btree" ("credential_id");



CREATE INDEX "webauthn_credentials_user_id_idx" ON "auth"."webauthn_credentials" USING "btree" ("user_id");



CREATE INDEX "admin_activity_log_created_at_idx" ON "public"."admin_activity_log" USING "btree" ("created_at" DESC);



CREATE INDEX "admin_activity_log_entity_idx" ON "public"."admin_activity_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "categories_sort_order_idx" ON "public"."categories" USING "btree" ("sort_order", "name");



CREATE INDEX "customer_addresses_customer_id_idx" ON "public"."customer_addresses" USING "btree" ("customer_id", "sort_order");



CREATE UNIQUE INDEX "customers_auth_user_id_unique" ON "public"."customers" USING "btree" ("auth_user_id") WHERE ("auth_user_id" IS NOT NULL);



CREATE INDEX "customers_document_id_normalized_idx" ON "public"."customers" USING "btree" ("public"."normalize_document_id"("document_id")) WHERE ("public"."normalize_document_id"("document_id") IS NOT NULL);



CREATE UNIQUE INDEX "customers_document_normalized_linked_unique" ON "public"."customers" USING "btree" ("public"."normalize_document_id"("document_id")) WHERE (("auth_user_id" IS NOT NULL) AND ("public"."normalize_document_id"("document_id") IS NOT NULL));



CREATE UNIQUE INDEX "customers_email_normalized_unique" ON "public"."customers" USING "btree" ("lower"(TRIM(BOTH FROM "email"))) WHERE (("email" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "email")) > 0));



CREATE INDEX "customers_name_idx" ON "public"."customers" USING "btree" ("name");



CREATE INDEX "order_items_order_id_idx" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "order_payment_proofs_order_id_idx" ON "public"."order_payment_proofs" USING "btree" ("order_id");



CREATE INDEX "orders_customer_id_idx" ON "public"."orders" USING "btree" ("customer_id");



CREATE INDEX "orders_status_idx" ON "public"."orders" USING "btree" ("status");



CREATE UNIQUE INDEX "orders_tracking_token_key" ON "public"."orders" USING "btree" ("tracking_token") WHERE ("tracking_token" IS NOT NULL);



CREATE INDEX "orders_wompi_payment_link_id_idx" ON "public"."orders" USING "btree" ("wompi_payment_link_id");



CREATE INDEX "product_variants_product_id_idx" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "product_variants_product_sort_idx" ON "public"."product_variants" USING "btree" ("product_id", "sort_order");



CREATE INDEX "products_category_id_idx" ON "public"."products" USING "btree" ("category_id");



CREATE UNIQUE INDEX "profiles_login_username_lower_key" ON "public"."profiles" USING "btree" ("lower"(TRIM(BOTH FROM "login_username"))) WHERE (("login_username" IS NOT NULL) AND ("length"(TRIM(BOTH FROM "login_username")) > 0));



CREATE INDEX "shipping_municipalities_department_idx" ON "public"."shipping_municipalities" USING "btree" ("department_code", "sort_order", "name");



CREATE INDEX "store_banners_placement_sort_idx" ON "public"."store_banners" USING "btree" ("placement", "sort_order", "created_at");



CREATE INDEX "store_coupon_products_product_id_idx" ON "public"."store_coupon_products" USING "btree" ("product_id");



CREATE UNIQUE INDEX "store_coupons_code_normalized_unique" ON "public"."store_coupons" USING "btree" ("lower"(TRIM(BOTH FROM "code")));



CREATE INDEX "store_coupons_enabled_banner_sort_idx" ON "public"."store_coupons" USING "btree" ("is_enabled", "show_in_banner", "sort_order", "created_at");



CREATE INDEX "store_expenses_date_idx" ON "public"."store_expenses" USING "btree" ("expense_date" DESC, "created_at" DESC);



CREATE INDEX "store_welcome_modals_enabled_sort_idx" ON "public"."store_welcome_modals" USING "btree" ("is_enabled", "sort_order", "created_at" DESC);



CREATE INDEX "supplier_invoice_attachments_invoice_idx" ON "public"."supplier_invoice_attachments" USING "btree" ("invoice_id", "sort_order", "created_at");



CREATE INDEX "supplier_invoice_lines_invoice_idx" ON "public"."supplier_invoice_lines" USING "btree" ("invoice_id", "sort_order");



CREATE INDEX "supplier_invoice_payments_invoice_idx" ON "public"."supplier_invoice_payments" USING "btree" ("invoice_id", "paid_at" DESC);



CREATE INDEX "supplier_invoices_supplier_idx" ON "public"."supplier_invoices" USING "btree" ("supplier_id", "issue_date" DESC, "created_at" DESC);



CREATE INDEX "suppliers_name_idx" ON "public"."suppliers" USING "btree" ("lower"("name"));



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "idx_iceberg_namespaces_bucket_id" ON "storage"."iceberg_namespaces" USING "btree" ("catalog_id", "name");



CREATE UNIQUE INDEX "idx_iceberg_tables_location" ON "storage"."iceberg_tables" USING "btree" ("location");



CREATE UNIQUE INDEX "idx_iceberg_tables_namespace_id" ON "storage"."iceberg_tables" USING "btree" ("catalog_id", "namespace_id", "name");



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_bucket_id_name_lower" ON "storage"."objects" USING "btree" ("bucket_id", "lower"("name") COLLATE "C");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "categories_set_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "customers_set_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "orders_set_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "product_variants_set_updated_at" BEFORE UPDATE ON "public"."product_variants" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "products_set_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_set_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "shipping_municipalities_set_updated_at" BEFORE UPDATE ON "public"."shipping_municipalities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "store_coupons_set_updated_at" BEFORE UPDATE ON "public"."store_coupons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "store_welcome_modals_set_updated_at" BEFORE UPDATE ON "public"."store_welcome_modals" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "protect_buckets_delete" BEFORE DELETE ON "storage"."buckets" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "protect_objects_delete" BEFORE DELETE ON "storage"."objects" FOR EACH STATEMENT EXECUTE FUNCTION "storage"."protect_delete"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."webauthn_challenges"
    ADD CONSTRAINT "webauthn_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."webauthn_credentials"
    ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_activity_log"
    ADD CONSTRAINT "admin_activity_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_payment_proofs"
    ADD CONSTRAINT "order_payment_proofs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipping_municipalities"
    ADD CONSTRAINT "shipping_municipalities_department_code_fkey" FOREIGN KEY ("department_code") REFERENCES "public"."shipping_departments"("code") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_coupon_products"
    ADD CONSTRAINT "store_coupon_products_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."store_coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."store_coupon_products"
    ADD CONSTRAINT "store_coupon_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_invoice_attachments"
    ADD CONSTRAINT "supplier_invoice_attachments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."supplier_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_invoice_lines"
    ADD CONSTRAINT "supplier_invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."supplier_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_invoice_lines"
    ADD CONSTRAINT "supplier_invoice_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."supplier_invoice_payments"
    ADD CONSTRAINT "supplier_invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."supplier_invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."supplier_invoices"
    ADD CONSTRAINT "supplier_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "storage"."iceberg_namespaces"
    ADD CONSTRAINT "iceberg_namespaces_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "storage"."buckets_analytics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."iceberg_tables"
    ADD CONSTRAINT "iceberg_tables_namespace_id_fkey" FOREIGN KEY ("namespace_id") REFERENCES "storage"."iceberg_namespaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_activity_log_insert_self" ON "public"."admin_activity_log" FOR INSERT TO "authenticated" WITH CHECK ((("actor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "me"
  WHERE ("me"."id" = "auth"."uid"())))));



CREATE POLICY "admin_activity_log_select_team" ON "public"."admin_activity_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "me"
  WHERE ("me"."id" = "auth"."uid"()))));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_delete_admin" ON "public"."categories" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "categories_insert_admin" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "categories_select_public" ON "public"."categories" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "categories_update_admin" ON "public"."categories" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."customer_addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customer_addresses_delete_admin" ON "public"."customer_addresses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customer_addresses_delete_store_owner" ON "public"."customer_addresses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "customer_addresses"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"()))))))));



CREATE POLICY "customer_addresses_insert_admin" ON "public"."customer_addresses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customer_addresses_insert_store_owner" ON "public"."customer_addresses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "customer_addresses"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"()))))))));



CREATE POLICY "customer_addresses_select_admin" ON "public"."customer_addresses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customer_addresses_select_store_owner" ON "public"."customer_addresses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "customer_addresses"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"()))))))));



CREATE POLICY "customer_addresses_update_admin" ON "public"."customer_addresses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customer_addresses_update_store_owner" ON "public"."customer_addresses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "customer_addresses"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"())))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "customer_addresses"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"()))))))));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_delete_admin" ON "public"."customers" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customers_insert_admin" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customers_select_admin" ON "public"."customers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customers_select_store_owner" ON "public"."customers" FOR SELECT TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))));



CREATE POLICY "customers_update_admin" ON "public"."customers" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "customers_update_store_owner" ON "public"."customers" FOR UPDATE TO "authenticated" USING ((("auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))))) WITH CHECK ((("auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))));



ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_items_delete_admin" ON "public"."order_items" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "order_items_insert_admin" ON "public"."order_items" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "order_items_select_admin" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "order_items_select_store_owner" ON "public"."order_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."orders" "o"
     JOIN "public"."customers" "c" ON (("c"."id" = "o"."customer_id")))
  WHERE (("o"."id" = "order_items"."order_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"()))))))));



ALTER TABLE "public"."order_payment_proofs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_payment_proofs_delete_admin" ON "public"."order_payment_proofs" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "order_payment_proofs_select_admin" ON "public"."order_payment_proofs" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete_admin" ON "public"."orders" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "orders_insert_admin" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "orders_select_admin" ON "public"."orders" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "orders_select_store_owner" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("customer_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "orders"."customer_id") AND ("c"."auth_user_id" = "auth"."uid"()) AND (NOT (EXISTS ( SELECT 1
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = "auth"."uid"())))))))));



CREATE POLICY "orders_update_admin" ON "public"."orders" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_variants_all_admin" ON "public"."product_variants" TO "authenticated" USING ("public"."user_has_admin_profile"()) WITH CHECK ("public"."user_has_admin_profile"());



CREATE POLICY "product_variants_select_public" ON "public"."product_variants" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_variants"."product_id") AND ("p"."is_published" = true)))));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_delete_admin" ON "public"."products" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "products_insert_admin" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "products_select_admin_all" ON "public"."products" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "products_select_published" ON "public"."products" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "products_update_admin" ON "public"."products" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_access" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."user_has_admin_profile"()));



CREATE POLICY "profiles_update_team" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "id") OR "public"."user_has_admin_profile"())) WITH CHECK ((("auth"."uid"() = "id") OR "public"."user_has_admin_profile"()));



ALTER TABLE "public"."shipping_departments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shipping_departments_select_admin" ON "public"."shipping_departments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "shipping_departments_select_public" ON "public"."shipping_departments" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."shipping_municipalities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "shipping_municipalities_select_admin" ON "public"."shipping_municipalities" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "shipping_municipalities_select_public" ON "public"."shipping_municipalities" FOR SELECT TO "authenticated", "anon" USING (("is_delivery_enabled" = true));



CREATE POLICY "shipping_municipalities_update_admin" ON "public"."shipping_municipalities" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."store_banners" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_banners_delete_admin" ON "public"."store_banners" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_banners_insert_admin" ON "public"."store_banners" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_banners_select_admin" ON "public"."store_banners" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_banners_select_public" ON "public"."store_banners" FOR SELECT TO "authenticated", "anon" USING (("is_published" = true));



CREATE POLICY "store_banners_update_admin" ON "public"."store_banners" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."store_coupon_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_coupon_products_delete_admin" ON "public"."store_coupon_products" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_coupon_products_insert_admin" ON "public"."store_coupon_products" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_coupon_products_select_admin" ON "public"."store_coupon_products" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."store_coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_coupons_delete_admin" ON "public"."store_coupons" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_coupons_insert_admin" ON "public"."store_coupons" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_coupons_select_admin" ON "public"."store_coupons" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_coupons_select_public_banner" ON "public"."store_coupons" FOR SELECT TO "authenticated", "anon" USING ((("is_enabled" = true) AND ("show_in_banner" = true) AND (("starts_at" IS NULL) OR ("starts_at" <= "now"())) AND (("ends_at" IS NULL) OR ("ends_at" >= "now"()))));



CREATE POLICY "store_coupons_update_admin" ON "public"."store_coupons" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."store_expenses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_expenses_delete_admin" ON "public"."store_expenses" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_expenses_insert_admin" ON "public"."store_expenses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_expenses_select_admin" ON "public"."store_expenses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_expenses_update_admin" ON "public"."store_expenses" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."store_welcome_modals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_welcome_modals_delete_admin" ON "public"."store_welcome_modals" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_welcome_modals_insert_admin" ON "public"."store_welcome_modals" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_welcome_modals_select_admin" ON "public"."store_welcome_modals" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "store_welcome_modals_select_public" ON "public"."store_welcome_modals" FOR SELECT TO "authenticated", "anon" USING (("is_enabled" = true));



CREATE POLICY "store_welcome_modals_update_admin" ON "public"."store_welcome_modals" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."supplier_invoice_attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supplier_invoice_attachments_delete_admin" ON "public"."supplier_invoice_attachments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_attachments_insert_admin" ON "public"."supplier_invoice_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_attachments_select_admin" ON "public"."supplier_invoice_attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."supplier_invoice_lines" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supplier_invoice_lines_delete_admin" ON "public"."supplier_invoice_lines" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_lines_insert_admin" ON "public"."supplier_invoice_lines" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_lines_select_admin" ON "public"."supplier_invoice_lines" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_lines_update_admin" ON "public"."supplier_invoice_lines" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."supplier_invoice_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supplier_invoice_payments_delete_admin" ON "public"."supplier_invoice_payments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_payments_insert_admin" ON "public"."supplier_invoice_payments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoice_payments_select_admin" ON "public"."supplier_invoice_payments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."supplier_invoices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "supplier_invoices_delete_admin" ON "public"."supplier_invoices" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoices_insert_admin" ON "public"."supplier_invoices" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoices_select_admin" ON "public"."supplier_invoices" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "supplier_invoices_update_admin" ON "public"."supplier_invoices" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_delete_admin" ON "public"."suppliers" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "suppliers_insert_admin" ON "public"."suppliers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "suppliers_select_admin" ON "public"."suppliers" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



CREATE POLICY "suppliers_update_admin" ON "public"."suppliers" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."iceberg_namespaces" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."iceberg_tables" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "order_payment_proofs_admin_delete" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'order-payment-proofs'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "order_payment_proofs_admin_read" ON "storage"."objects" FOR SELECT TO "authenticated" USING ((("bucket_id" = 'order-payment-proofs'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "product_images_admin_delete" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'product-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "product_images_admin_insert" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'product-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "product_images_admin_update" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'product-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))) WITH CHECK ((("bucket_id" = 'product-images'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "product_images_public_read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'product-images'::"text"));



ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "store_banners_storage_admin_delete" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'store-banners'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "store_banners_storage_admin_insert" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'store-banners'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "store_banners_storage_admin_update" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'store-banners'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))) WITH CHECK ((("bucket_id" = 'store-banners'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "store_banners_storage_public_read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'store-banners'::"text"));



CREATE POLICY "supplier_invoice_files_admin_delete" ON "storage"."objects" FOR DELETE TO "authenticated" USING ((("bucket_id" = 'supplier-invoice-files'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "supplier_invoice_files_admin_insert" ON "storage"."objects" FOR INSERT TO "authenticated" WITH CHECK ((("bucket_id" = 'supplier-invoice-files'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "supplier_invoice_files_admin_update" ON "storage"."objects" FOR UPDATE TO "authenticated" USING ((("bucket_id" = 'supplier-invoice-files'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"()))))) WITH CHECK ((("bucket_id" = 'supplier-invoice-files'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = "auth"."uid"())))));



CREATE POLICY "supplier_invoice_files_public_read" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'supplier-invoice-files'::"text"));



ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";



REVOKE ALL ON FUNCTION "public"."document_has_registered_account"("p_normalized" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."document_has_registered_account"("p_normalized" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."document_has_registered_account"("p_normalized" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."document_has_registered_account"("p_normalized" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_customer_id_by_document_normalized"("p_normalized" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."normalize_document_id"("p" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."normalize_document_id"("p" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."normalize_document_id"("p" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."normalize_document_id"("p" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."storefront_coupon_discount_for_product"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."storefront_coupon_discount_for_product"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."storefront_coupon_discount_for_product"("p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."storefront_coupon_discounts"() TO "anon";
GRANT ALL ON FUNCTION "public"."storefront_coupon_discounts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."storefront_coupon_discounts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_admin_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_admin_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_admin_profile"() TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "postgres";
GRANT ALL ON TABLE "auth"."custom_oauth_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_client_states" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_client_states" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";



GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "auth"."webauthn_challenges" TO "postgres";
GRANT ALL ON TABLE "auth"."webauthn_challenges" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."webauthn_credentials" TO "postgres";
GRANT ALL ON TABLE "auth"."webauthn_credentials" TO "dashboard_user";



GRANT ALL ON TABLE "public"."admin_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."customer_addresses" TO "anon";
GRANT ALL ON TABLE "public"."customer_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."order_payment_proofs" TO "anon";
GRANT ALL ON TABLE "public"."order_payment_proofs" TO "authenticated";
GRANT ALL ON TABLE "public"."order_payment_proofs" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_departments" TO "anon";
GRANT ALL ON TABLE "public"."shipping_departments" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_departments" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_municipalities" TO "anon";
GRANT ALL ON TABLE "public"."shipping_municipalities" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_municipalities" TO "service_role";



GRANT ALL ON TABLE "public"."store_banners" TO "anon";
GRANT ALL ON TABLE "public"."store_banners" TO "authenticated";
GRANT ALL ON TABLE "public"."store_banners" TO "service_role";



GRANT ALL ON TABLE "public"."store_coupon_products" TO "anon";
GRANT ALL ON TABLE "public"."store_coupon_products" TO "authenticated";
GRANT ALL ON TABLE "public"."store_coupon_products" TO "service_role";



GRANT ALL ON TABLE "public"."store_coupons" TO "anon";
GRANT ALL ON TABLE "public"."store_coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."store_coupons" TO "service_role";



GRANT ALL ON TABLE "public"."store_expenses" TO "anon";
GRANT ALL ON TABLE "public"."store_expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."store_expenses" TO "service_role";



GRANT ALL ON TABLE "public"."store_welcome_modals" TO "anon";
GRANT ALL ON TABLE "public"."store_welcome_modals" TO "authenticated";
GRANT ALL ON TABLE "public"."store_welcome_modals" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_invoice_attachments" TO "anon";
GRANT ALL ON TABLE "public"."supplier_invoice_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_invoice_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_invoice_lines" TO "anon";
GRANT ALL ON TABLE "public"."supplier_invoice_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_invoice_lines" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."supplier_invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_invoices" TO "anon";
GRANT ALL ON TABLE "public"."supplier_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "anon";



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



GRANT ALL ON TABLE "storage"."iceberg_namespaces" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_namespaces" TO "anon";



GRANT ALL ON TABLE "storage"."iceberg_tables" TO "service_role";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "authenticated";
GRANT SELECT ON TABLE "storage"."iceberg_tables" TO "anon";



GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




