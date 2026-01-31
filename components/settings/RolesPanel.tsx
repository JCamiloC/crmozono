import type { RoleSummary } from "../../types";

type RolesPanelProps = {
  roles: RoleSummary[];
};

export default function RolesPanel({ roles }: RolesPanelProps) {
  return (
    <div className="rounded-2xl border border-botanical-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-botanical-900">Roles del sistema</h2>
      <p className="mt-1 text-sm text-botanical-600">
        Vista general de permisos por rol.
      </p>
      <div className="mt-4 space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="rounded-2xl border border-botanical-100 bg-botanical-50 p-4">
            <p className="text-sm font-semibold text-botanical-900">{role.name}</p>
            <p className="text-xs text-botanical-600">{role.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-full bg-white px-3 py-1 text-xs text-botanical-700"
                >
                  {permission}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
