import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://aupodprsjpcnilwvmtku.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cG9kcHJzanBjbmlsd3ZtdGt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU2NDAxOCwiZXhwIjoyMDkxMTQwMDE4fQ.G6KDF_RUaY_MkDuzcyonsyYvmr6kTtc0taafKJ1G5yc";

const supabase = createClient(supabaseUrl, serviceKey);

async function addMissingColumns() {
  const columns = [
    { name: "endpoint", type: "text" },
    { name: "method", type: "text", default: "POST" },
    { name: "rateLimit", type: "integer" },
    { name: "timeout", type: "integer" },
    { name: "retryPolicy", type: "text" },
    { name: "responseFormat", type: "text" },
    { name: "schema", type: "text" },
    { name: "usageExamples", type: "text[]" },
  ];

  for (const col of columns) {
    try {
      // Check if column exists by trying to select it
      const { error: selectError } = await supabase
        .from("services")
        .select(col.name)
        .limit(1);

      if (
        selectError &&
        selectError.message.includes(`column "${col.name}" does not exist`)
      ) {
        console.log(`Adding column: ${col.name}`);
        // We can't directly add columns via JS client, so we'll log what needs to be done
        console.log(
          `Run: ALTER TABLE services ADD COLUMN ${col.name} ${col.type}${
            col.default ? ` DEFAULT '${col.default}'` : ""
          };`
        );
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    } catch (err) {
      console.error(`Error checking ${col.name}:`, err);
    }
  }
}

addMissingColumns();
