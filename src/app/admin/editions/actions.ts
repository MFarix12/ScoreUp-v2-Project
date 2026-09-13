"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

/* =========================================================
   CREATE EDITION
========================================================= */

export async function createEdition(
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const year = Number(
    formData.get("year")
  );

  const startDate = String(
    formData.get("start_date") ?? ""
  );

  const endDate = String(
    formData.get("end_date") ?? ""
  );

  const status = String(
    formData.get("status") ?? "draft"
  );

  const isActive =
    formData.get("is_active") === "on";

  const isPublic =
    formData.get("is_public") === "on";

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (!name) {
    throw new Error(
      "Edition name is required."
    );
  }

  if (
    !Number.isInteger(year) ||
    year < 2000
  ) {
    throw new Error(
      "Please enter a valid year."
    );
  }

  if (
    !startDate ||
    !endDate
  ) {
    throw new Error(
      "Start date and end date are required."
    );
  }

  if (
    new Date(startDate) >
    new Date(endDate)
  ) {
    throw new Error(
      "End date must be after the start date."
    );
  }

  if (
    ![
      "draft",
      "active",
      "completed",
      "archived",
    ].includes(status)
  ) {
    throw new Error(
      "Invalid edition status."
    );
  }

  /* =======================================================
     CHECK DUPLICATE YEAR
  ======================================================= */

  const {
    data: existingEdition,
    error: existingError,
  } = await supabase
    .from("games_editions")
    .select("id")
    .eq("year", year)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      existingError.message
    );
  }

  if (existingEdition) {
    throw new Error(
      `A Games Edition for ${year} already exists.`
    );
  }

  /* =======================================================
     ONLY ONE ACTIVE EDITION
  ======================================================= */

  if (isActive) {
    const {
      error: deactivateError,
    } = await supabase
      .from("games_editions")
      .update({
        is_active: false,
      })
      .eq("is_active", true);

    if (deactivateError) {
      throw new Error(
        deactivateError.message
      );
    }
  }

  /* =======================================================
     CREATE EDITION
  ======================================================= */

  const { error } = await supabase
    .from("games_editions")
    .insert({
      name,
      year,
      start_date: startDate,
      end_date: endDate,
      status,
      is_active: isActive,
      is_public: isPublic,
    });

  if (error) {
    throw new Error(
      error.message
    );
  }

  /* =======================================================
     REVALIDATE
  ======================================================= */

  revalidatePath(
    "/admin/editions"
  );

  revalidatePath("/");

  redirect(
    "/admin/editions"
  );
}

/* =========================================================
   UPDATE EDITION
========================================================= */

export async function updateEdition(
  editionId: string,
  formData: FormData
) {
  await requireAdmin();

  const supabase = await createClient();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const year = Number(
    formData.get("year")
  );

  const startDate = String(
    formData.get("start_date") ?? ""
  );

  const endDate = String(
    formData.get("end_date") ?? ""
  );

  const status = String(
    formData.get("status") ?? "draft"
  );

  const isActive =
    formData.get("is_active") === "on";

  const isPublic =
    formData.get("is_public") === "on";

  /* =======================================================
     VALIDATION
  ======================================================= */

  if (!name) {
    throw new Error(
      "Edition name is required."
    );
  }

  if (
    !Number.isInteger(year) ||
    year < 2000
  ) {
    throw new Error(
      "Please enter a valid year."
    );
  }

  if (
    !startDate ||
    !endDate
  ) {
    throw new Error(
      "Start date and end date are required."
    );
  }

  if (
    new Date(startDate) >
    new Date(endDate)
  ) {
    throw new Error(
      "End date must be after the start date."
    );
  }

  if (
    ![
      "draft",
      "active",
      "completed",
      "archived",
    ].includes(status)
  ) {
    throw new Error(
      "Invalid edition status."
    );
  }

  /* =======================================================
     CHECK EDITION EXISTS
  ======================================================= */

  const {
    data: currentEdition,
    error: editionError,
  } = await supabase
    .from("games_editions")
    .select(`
      id,
      year
    `)
    .eq("id", editionId)
    .single();

  if (
    editionError ||
    !currentEdition
  ) {
    throw new Error(
      "Games Edition could not be found."
    );
  }

  /* =======================================================
     CHECK DUPLICATE YEAR
  ======================================================= */

  const {
    data: duplicateEdition,
    error: duplicateError,
  } = await supabase
    .from("games_editions")
    .select("id")
    .eq("year", year)
    .neq("id", editionId)
    .maybeSingle();

  if (duplicateError) {
    throw new Error(
      duplicateError.message
    );
  }

  if (duplicateEdition) {
    throw new Error(
      `Another Games Edition already uses the year ${year}.`
    );
  }

  /* =======================================================
     ONLY ONE ACTIVE EDITION
  ======================================================= */

  if (isActive) {
    const {
      error: deactivateError,
    } = await supabase
      .from("games_editions")
      .update({
        is_active: false,
      })
      .neq("id", editionId)
      .eq("is_active", true);

    if (deactivateError) {
      throw new Error(
        deactivateError.message
      );
    }
  }

  /* =======================================================
     UPDATE EDITION
  ======================================================= */

  const { error } = await supabase
    .from("games_editions")
    .update({
      name,
      year,
      start_date: startDate,
      end_date: endDate,
      status,
      is_active: isActive,
      is_public: isPublic,
    })
    .eq("id", editionId);

  if (error) {
    throw new Error(
      error.message
    );
  }

  /* =======================================================
     REVALIDATE
  ======================================================= */

  revalidatePath(
    "/admin/editions"
  );

  revalidatePath(
    `/admin/editions/${editionId}/edit`
  );

  revalidatePath("/");

  revalidatePath("/schedule");
  revalidatePath("/fixtures");
  revalidatePath("/results");
  revalidatePath("/bracket");

  redirect(
    "/admin/editions"
  );
}