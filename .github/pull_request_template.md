## Summary

- _Summarize the changes that have been made_

## Related issue(s)

- _Link to ticket or issue number_

## Testing done

- _Describe the steps required to verify your changes are working as expected_

### Checklist

- [ ] Tested `npm link` changes with `vets-website`
- [ ] Tested in **interactive mode** (in vets-website, running `yarn new:app` with prompts with Node.js 14.15.0)
- [ ] Tested in **non-interactive mode** (in vets-website, running `yo @department-of-veterans-affairs/vets-website` with all arguments provided upfront with Node.js 14.15.0)
- [ ] Documentation has been updated
- [ ] Changelog has been updated
- [ ] Bumped version in `package.json` (if this is a release)
- [ ] Ran `npm install` to update lock file if any dependencies changed