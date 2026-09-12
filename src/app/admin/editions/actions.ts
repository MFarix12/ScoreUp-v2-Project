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

  if (!name) {
    throw new Error(
      "Edition name is required."
    );
  }

  if (isActive) {
    const { error: deactivateError } =
      await supabase
        .from("games_editions")
        .update({
          is_active: false,
        })
        .eq("is_active", true)
        .neq("id", editionId);

    if (deactivateError) {
      throw new Error(
        deactivateError.message
      );
    }
  }

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
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/editions");

  redirect("/admin/editions");
}