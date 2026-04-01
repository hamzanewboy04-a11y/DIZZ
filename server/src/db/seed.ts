import { Client } from 'pg'
import * as mock from '../shared/mock.js'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const client = new Client({ connectionString: databaseUrl })

async function seedUsers() {
  for (const user of mock.users) {
    await client.query(
      `
        INSERT INTO users (id, name, roles)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            roles = EXCLUDED.roles
      `,
      [user.id, user.name, user.roles],
    )
  }
}

async function seedProjects() {
  for (const project of mock.projects) {
    await client.query(
      `
        INSERT INTO projects (id, name)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name
      `,
      [project.id, project.name],
    )
  }
}

async function seedCreatives() {
  for (const creative of mock.creatives) {
    await client.query(
      `
        INSERT INTO creatives (
          id, internal_code, title, brief, type, subtypes, priority, status,
          project_id, requested_by_id, ordered_by_user_id, assigned_to_id, price,
          created_at, updated_at, submitted_at, accepted_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17
        )
        ON CONFLICT (id) DO UPDATE
        SET internal_code = EXCLUDED.internal_code,
            title = EXCLUDED.title,
            brief = EXCLUDED.brief,
            type = EXCLUDED.type,
            subtypes = EXCLUDED.subtypes,
            priority = EXCLUDED.priority,
            status = EXCLUDED.status,
            project_id = EXCLUDED.project_id,
            requested_by_id = EXCLUDED.requested_by_id,
            ordered_by_user_id = EXCLUDED.ordered_by_user_id,
            assigned_to_id = EXCLUDED.assigned_to_id,
            price = EXCLUDED.price,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at,
            submitted_at = EXCLUDED.submitted_at,
            accepted_at = EXCLUDED.accepted_at
      `,
      [
        creative.id,
        creative.internalCode,
        creative.title,
        creative.brief,
        creative.type,
        creative.subtypes,
        creative.priority,
        creative.status,
        creative.projectId,
        creative.requestedById,
        creative.orderedByUserId,
        creative.assignedToId,
        creative.price,
        creative.createdAt,
        creative.updatedAt,
        creative.submittedAt,
        creative.acceptedAt,
      ],
    )
  }

  for (const log of mock.creativeStatusLogs) {
    await client.query(
      `
        INSERT INTO creative_status_logs (id, creative_id, from_status, to_status, changed_by_id, created_at, note)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET creative_id = EXCLUDED.creative_id,
            from_status = EXCLUDED.from_status,
            to_status = EXCLUDED.to_status,
            changed_by_id = EXCLUDED.changed_by_id,
            created_at = EXCLUDED.created_at,
            note = EXCLUDED.note
      `,
      [log.id, log.creativeId, log.fromStatus, log.toStatus, log.changedById, log.createdAt, log.note ?? null],
    )
  }
}

async function seedVisuals() {
  for (const visual of mock.visuals) {
    await client.query(
      `
        INSERT INTO visual_requests (
          id, display_id, title, requester_id, assigned_designer_id, department,
          task_type, status, urgency, project_id, brief, revision_count,
          deadline_at, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15
        )
        ON CONFLICT (id) DO UPDATE
        SET display_id = EXCLUDED.display_id,
            title = EXCLUDED.title,
            requester_id = EXCLUDED.requester_id,
            assigned_designer_id = EXCLUDED.assigned_designer_id,
            department = EXCLUDED.department,
            task_type = EXCLUDED.task_type,
            status = EXCLUDED.status,
            urgency = EXCLUDED.urgency,
            project_id = EXCLUDED.project_id,
            brief = EXCLUDED.brief,
            revision_count = EXCLUDED.revision_count,
            deadline_at = EXCLUDED.deadline_at,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
      `,
      [
        visual.id,
        visual.displayId,
        visual.title,
        visual.requesterId,
        visual.assignedDesignerId,
        visual.department,
        visual.taskType,
        visual.status,
        visual.urgency,
        visual.projectId,
        visual.brief,
        visual.revisionCount,
        visual.deadlineAt ?? null,
        visual.createdAt,
        visual.updatedAt,
      ],
    )
  }

  for (const log of mock.visualStatusLogs) {
    await client.query(
      `
        INSERT INTO visual_status_logs (id, visual_request_id, from_status, to_status, changed_by_id, comment, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET visual_request_id = EXCLUDED.visual_request_id,
            from_status = EXCLUDED.from_status,
            to_status = EXCLUDED.to_status,
            changed_by_id = EXCLUDED.changed_by_id,
            comment = EXCLUDED.comment,
            created_at = EXCLUDED.created_at
      `,
      [log.id, log.visualRequestId, log.fromStatus, log.toStatus, log.changedById ?? null, log.comment ?? null, log.createdAt],
    )
  }
}

async function seedModels() {
  for (const profile of mock.modelProfiles) {
    await client.query(
      `
        INSERT INTO model_profiles (id, name, geo, age, description, project_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name,
            geo = EXCLUDED.geo,
            age = EXCLUDED.age,
            description = EXCLUDED.description,
            project_id = EXCLUDED.project_id,
            created_at = EXCLUDED.created_at,
            updated_at = EXCLUDED.updated_at
      `,
      [profile.id, profile.name, profile.geo, profile.age ?? null, profile.description ?? null, profile.projectId, profile.createdAt, profile.updatedAt],
    )
  }

  for (const block of mock.modelProfileBlocks) {
    await client.query(
      `
        INSERT INTO model_profile_blocks (id, profile_id, title, content, sort_order)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET profile_id = EXCLUDED.profile_id,
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            sort_order = EXCLUDED.sort_order
      `,
      [block.id, block.profileId, block.title, block.content, block.sortOrder],
    )
  }
}

async function seedTeam() {
  for (const setting of mock.designStaffSettings) {
    await client.query(
      `
        INSERT INTO design_staff_settings (id, user_id, role_label, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            role_label = EXCLUDED.role_label,
            is_active = EXCLUDED.is_active
      `,
      [setting.id, setting.userId, setting.roleLabel, setting.isActive],
    )
  }

  for (const period of mock.staffRatePeriods) {
    await client.query(
      `
        INSERT INTO staff_rate_periods (id, user_id, rate_label, rate_value, start_date, end_date)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            rate_label = EXCLUDED.rate_label,
            rate_value = EXCLUDED.rate_value,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date
      `,
      [period.id, period.userId, period.rateLabel, period.rateValue, period.startDate, period.endDate],
    )
  }

  for (const report of mock.reviewerReports) {
    await client.query(
      `
        INSERT INTO reviewer_reports (id, user_id, date, geo, big_reviews, mini_reviews, total_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            date = EXCLUDED.date,
            geo = EXCLUDED.geo,
            big_reviews = EXCLUDED.big_reviews,
            mini_reviews = EXCLUDED.mini_reviews,
            total_earned = EXCLUDED.total_earned
      `,
      [report.id, report.userId, report.date, report.geo, report.bigReviews, report.miniReviews, report.totalEarned],
    )
  }

  for (const report of mock.smmReports) {
    await client.query(
      `
        INSERT INTO smm_reports (id, user_id, date, channel_geo, posts, stories, total_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            date = EXCLUDED.date,
            channel_geo = EXCLUDED.channel_geo,
            posts = EXCLUDED.posts,
            stories = EXCLUDED.stories,
            total_earned = EXCLUDED.total_earned
      `,
      [report.id, report.userId, report.date, report.channelGeo, report.posts, report.stories, report.totalEarned],
    )
  }
}

async function resetSequences() {
  await client.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE((SELECT MAX(id) FROM projects), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('creatives', 'id'), COALESCE((SELECT MAX(id) FROM creatives), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('creative_status_logs', 'id'), COALESCE((SELECT MAX(id) FROM creative_status_logs), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('visual_requests', 'id'), COALESCE((SELECT MAX(id) FROM visual_requests), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('visual_status_logs', 'id'), COALESCE((SELECT MAX(id) FROM visual_status_logs), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('model_profiles', 'id'), COALESCE((SELECT MAX(id) FROM model_profiles), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('model_profile_blocks', 'id'), COALESCE((SELECT MAX(id) FROM model_profile_blocks), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('design_staff_settings', 'id'), COALESCE((SELECT MAX(id) FROM design_staff_settings), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('staff_rate_periods', 'id'), COALESCE((SELECT MAX(id) FROM staff_rate_periods), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('reviewer_reports', 'id'), COALESCE((SELECT MAX(id) FROM reviewer_reports), 1), true)`)
  await client.query(`SELECT setval(pg_get_serial_sequence('smm_reports', 'id'), COALESCE((SELECT MAX(id) FROM smm_reports), 1), true)`)
}

async function main() {
  await client.connect()
  await client.query('BEGIN')
  await seedUsers()
  await seedProjects()
  await seedCreatives()
  await seedVisuals()
  await seedModels()
  await seedTeam()
  await resetSequences()
  await client.query('COMMIT')
  console.log('Database seeded from mock data')
  await client.end()
}

main().catch(async (error) => {
  console.error(error)
  try {
    await client.query('ROLLBACK')
  } catch {}
  try {
    await client.end()
  } catch {}
  process.exit(1)
})
